const path = require('path');

const serverSrc = path.join(__dirname, '..', 'src');
const { query, pool } = require(path.join(serverSrc, 'configs', 'database'));

const QA_EMAILS = {
  admin: 'admin@gmail.com',
  ministry: 'qa_ministry_manager@example.test',
  department: 'qa_department_manager@example.test',
  spotOperator: 'qa_spot_operator@example.test',
  travelCompany: 'qa_travel_company@example.test',
  serviceProvider: 'qa_service_provider@example.test',
};

const REPORT_MARKER = '[QA_REAL_DASHBOARD_SEED]';
const CAPACITY_SOURCE = 'qa_dashboard_seed';
const VISIT_SOURCE = 'dashboard_seed';

const monthReports = [
  ['2026-01-01', '2026-01-31', 185000000, 86, 420, 64.5],
  ['2026-02-01', '2026-02-28', 214000000, 102, 510, 69.2],
  ['2026-03-01', '2026-03-31', 248000000, 118, 620, 73.4],
  ['2026-04-01', '2026-04-30', 302000000, 144, 780, 81.1],
  ['2026-05-01', '2026-05-31', 336000000, 169, 890, 84.8],
  ['2026-06-01', '2026-06-30', 368000000, 176, 940, 87.6],
];

function requireUser(users, key) {
  const user = users[key];
  if (!user) {
    throw new Error(`Missing required account: ${QA_EMAILS[key]}`);
  }
  return user;
}

async function loadUsers() {
  const { rows } = await query(
    `
      SELECT u.id, u.email, u.full_name, r.code AS role_code
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.email = ANY($1::text[])
    `,
    [Object.values(QA_EMAILS)]
  );

  const byEmail = new Map(rows.map((row) => [row.email, row]));
  return Object.fromEntries(
    Object.entries(QA_EMAILS).map(([key, email]) => [key, byEmail.get(email)])
  );
}

async function loadSpots() {
  const { rows } = await query(`
    SELECT id, name_vi, province_code, COALESCE(max_capacity, 1500) AS max_capacity,
           ST_X(geom::geometry) AS lng, ST_Y(geom::geometry) AS lat
    FROM tourism_spots
    WHERE status = 'active' AND province_code = '37'
    ORDER BY is_featured DESC, rating_avg DESC NULLS LAST, name_vi
    LIMIT 12
  `);

  if (rows.length < 5) {
    throw new Error('Need at least 5 active tourism_spots in province 37 for dashboard seeding.');
  }

  return rows;
}

async function ensureBusiness({ owner, admin, spot, businessName, businessCode, businessType, email, phone }) {
  const existing = await query(
    'SELECT * FROM businesses WHERE owner_id = $1 AND business_code = $2 LIMIT 1',
    [owner.id, businessCode]
  );

  if (!existing.rows.length) {
    const inserted = await query(
      `
        INSERT INTO businesses (
          owner_id, province_code, business_name, business_code, business_type,
          description_vi, phone, email, address_vi, geom, status,
          approved_by, approved_at, created_at, updated_at
        ) VALUES (
          $1, '37', $2, $3, $4, $5, $6, $7, $8,
          ST_SetSRID(ST_MakePoint($9, $10), 4326),
          'approved', $11, NOW(), NOW() - INTERVAL '45 days', NOW()
        )
        RETURNING *
      `,
      [
        owner.id,
        businessName,
        businessCode,
        businessType,
        `Don vi van hanh du lich phuc vu du lieu dashboard cho tai khoan ${owner.email}.`,
        phone,
        email,
        `${spot.name_vi}, Ninh Binh`,
        Number(spot.lng),
        Number(spot.lat),
        admin.id,
      ]
    );
    return inserted.rows[0];
  }

  const updated = await query(
    `
      UPDATE businesses
      SET status = 'approved',
          approved_by = $1,
          approved_at = COALESCE(approved_at, NOW()),
          province_code = '37',
          geom = COALESCE(geom, ST_SetSRID(ST_MakePoint($2, $3), 4326)),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `,
    [admin.id, Number(spot.lng), Number(spot.lat), existing.rows[0].id]
  );
  return updated.rows[0];
}

async function ensureQaBusinesses(users, spots) {
  const admin = requireUser(users, 'admin');
  const spotOperator = requireUser(users, 'spotOperator');
  const travelCompany = requireUser(users, 'travelCompany');
  const serviceProvider = requireUser(users, 'serviceProvider');

  await query(
    `
      UPDATE businesses
      SET status = 'approved',
          approved_by = $1,
          approved_at = COALESCE(approved_at, NOW()),
          updated_at = NOW()
      WHERE owner_id = ANY($2::uuid[])
    `,
    [admin.id, [spotOperator.id, travelCompany.id, serviceProvider.id]]
  );

  const specs = [
    {
      owner: spotOperator,
      spot: spots[1],
      businessName: 'Ban quan ly trai nghiem Van Long QA',
      businessCode: 'QA-SPOT-OPERATOR-VAN-LONG',
      businessType: 'spot_operator',
      email: 'operator.vanlong@example.test',
      phone: '0229000001',
    },
    {
      owner: travelCompany,
      spot: spots[0],
      businessName: 'Cong ty lu hanh Trang An QA',
      businessCode: 'QA-TRAVEL-TRANG-AN',
      businessType: 'travel_company',
      email: 'travel.trangan@example.test',
      phone: '0229000002',
    },
    {
      owner: serviceProvider,
      spot: spots[7],
      businessName: 'Trung tam dich vu du lich Tam Coc QA',
      businessCode: 'QA-SERVICE-TAM-COC',
      businessType: 'service_provider',
      email: 'service.tamcoc@example.test',
      phone: '0229000003',
    },
  ];

  const ensured = [];
  for (const spec of specs) {
    ensured.push(await ensureBusiness({ ...spec, admin }));
  }

  const owned = await query(
    `
      SELECT *
      FROM businesses
      WHERE owner_id = ANY($1::uuid[])
      ORDER BY created_at, business_name
    `,
    [[spotOperator.id, travelCompany.id, serviceProvider.id]]
  );

  return new Map([...owned.rows, ...ensured].map((business) => [business.id, business]));
}

async function seedBusinessReports(businesses, users) {
  const businessRows = [...businesses.values()];
  await query(
    'DELETE FROM business_activity_reports WHERE business_id = ANY($1::uuid[]) AND notes LIKE $2',
    [businessRows.map((business) => business.id), `${REPORT_MARKER}%`]
  );

  let count = 0;
  for (const business of businessRows) {
    for (const [from, to, baseRevenue, baseBookings, baseVisitors, baseCapacity] of monthReports) {
      const ownerBoost = business.business_type === 'travel_company' ? 1.18 : business.business_type === 'service_provider' ? 0.82 : 1;
      await query(
        `
          INSERT INTO business_activity_reports (
            business_id, report_period, period_from, period_to,
            total_revenue_vnd, total_bookings, total_visitors, avg_capacity_pct,
            notes, status, submitted_by, reviewed_by, reviewed_at, created_at, updated_at
          ) VALUES (
            $1, 'month', $2, $3, $4, $5, $6, $7,
            $8, 'approved', $9, $10, $11::date + INTERVAL '2 days', $11::date + INTERVAL '1 day', NOW()
          )
        `,
        [
          business.id,
          from,
          to,
          Math.round(baseRevenue * ownerBoost),
          Math.round(baseBookings * ownerBoost),
          Math.round(baseVisitors * ownerBoost),
          Math.min(96.5, Number((baseCapacity * ownerBoost).toFixed(2))),
          `${REPORT_MARKER} Bao cao van hanh thang ${from.slice(0, 7)} cho ${business.business_name}`,
          business.owner_id,
          users.department.id,
          to,
        ]
      );
      count += 1;
    }
  }
  return count;
}

async function seedServicesAndCapacity(businesses, spots, users) {
  const businessRows = [...businesses.values()];
  const serviceSpecs = businessRows.map((business, index) => ({
    business,
    spot: spots[index % spots.length],
    name: `Dich vu du lich ${business.business_name}`,
    category: business.business_type || 'tourism',
  }));

  let serviceCount = 0;
  for (const spec of serviceSpecs) {
    const existing = await query(
      'SELECT id FROM services WHERE business_id = $1 AND service_name_vi = $2 LIMIT 1',
      [spec.business.id, spec.name]
    );

    if (existing.rows.length) {
      await query(
        `
          UPDATE services
          SET spot_id = $1, category = $2, is_active = TRUE
          WHERE id = $3
        `,
        [spec.spot.id, spec.category, existing.rows[0].id]
      );
    } else {
      await query(
        `
          INSERT INTO services (
            business_id, spot_id, service_name_vi, category, description_vi,
            price_from, price_to, currency, unit, booking_url, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'VND', 'khach', $8, TRUE)
        `,
        [
          spec.business.id,
          spec.spot.id,
          spec.name,
          spec.category,
          `Dich vu thuc te gan voi ${spec.spot.name_vi} cho dashboard doanh nghiep.`,
          120000,
          850000,
          `https://dulichninhbinh.vn/booking/${spec.business.id}`,
        ]
      );
    }
    serviceCount += 1;
  }

  await query('DELETE FROM capacity_logs WHERE data_source = $1', [CAPACITY_SOURCE]);

  const alertStatuses = ['overloaded', 'near_full', 'busy', 'near_full', 'normal'];
  let capacityCount = 0;
  for (let i = 0; i < Math.min(spots.length, 8); i += 1) {
    const spot = spots[i];
    const status = alertStatuses[i % alertStatuses.length];
    const pct = status === 'overloaded' ? 106 + i : status === 'near_full' ? 91 + i : status === 'busy' ? 78 : 48;
    const visitors = Math.round(Number(spot.max_capacity || 1500) * pct / 100);
    await query(
      `
        INSERT INTO capacity_logs (
          spot_id, recorded_at, visitor_count, capacity_pct, status, data_source, recorded_by
        ) VALUES ($1, NOW() - ($2::text || ' minutes')::interval, $3, $4, $5, $6, $7)
      `,
      [spot.id, String(i), visitors, pct, status, CAPACITY_SOURCE, users.department.id]
    );
    capacityCount += 1;
  }

  return { serviceCount, capacityCount };
}

async function seedMapData(users) {
  const categorySpecs = [
    ['tourism_core', 'Du lich trong diem', 'Core tourism layers', 'Lop du lieu diem du lich, dich vu va tuyen tham quan', 1],
    ['operations', 'Dieu hanh van hanh', 'Operations', 'Lop theo doi tai, phan anh va khu vuc can quan ly', 2],
    ['environment', 'Moi truong va bao ton', 'Environment and conservation', 'Lop giam sat canh quan, bao ton va bien dong moi truong', 3],
  ];

  const categoryIds = {};
  for (const [code, nameVi, nameEn, description, sortOrder] of categorySpecs) {
    const { rows } = await query(
      `
        INSERT INTO map_categories (code, name_vi, name_en, description, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        ON CONFLICT (code) DO UPDATE
        SET name_vi = EXCLUDED.name_vi,
            name_en = EXCLUDED.name_en,
            description = EXCLUDED.description,
            sort_order = EXCLUDED.sort_order,
            is_active = TRUE
        RETURNING id
      `,
      [code, nameVi, nameEn, description, sortOrder]
    );
    categoryIds[code] = rows[0].id;
  }

  const layerSpecs = [
    ['qa_tourism_spots', categoryIds.tourism_core, 'Diem du lich dang hoat dong', 'geojson', '/api/v1/spots/geojson', { color: '#1f7a5c', radius: 6 }, 1],
    ['qa_business_services', categoryIds.tourism_core, 'Dich vu du lich cua doanh nghiep', 'geojson', '/api/v1/businesses?status=approved', { color: '#2563eb', radius: 5 }, 2],
    ['qa_capacity_status', categoryIds.operations, 'Trang thai tai diem den', 'geojson', '/api/v1/capacity/current', { colorBy: 'status' }, 3],
    ['qa_feedback_hotspots', categoryIds.operations, 'Diem nong phan anh cong dan', 'geojson', '/api/v1/citizen-feedbacks?moderation_status=approved', { color: '#dc2626', radius: 7 }, 4],
    ['qa_conservation_monitoring', categoryIds.environment, 'Khu bao ton va giam sat bien dong', 'geojson', '/api/v1/governance/ministry/conservation-summary', { color: '#15803d', weight: 2 }, 5],
  ];

  const layerIds = {};
  for (const [code, categoryId, nameVi, layerType, sourceUrl, styleJson, sortOrder] of layerSpecs) {
    const { rows } = await query(
      `
        INSERT INTO map_layers (
          category_id, code, name_vi, layer_type, source_url, style_json,
          min_zoom, max_zoom, is_default_visible, sort_order, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, 6, 20, TRUE, $7, 'active', $8)
        ON CONFLICT (code) DO UPDATE
        SET category_id = EXCLUDED.category_id,
            name_vi = EXCLUDED.name_vi,
            layer_type = EXCLUDED.layer_type,
            source_url = EXCLUDED.source_url,
            style_json = EXCLUDED.style_json,
            sort_order = EXCLUDED.sort_order,
            status = 'active',
            updated_at = NOW()
        RETURNING id
      `,
      [categoryId, code, nameVi, layerType, sourceUrl, JSON.stringify(styleJson), sortOrder, users.admin.id]
    );
    layerIds[code] = rows[0].id;
  }

  let apiCount = 0;
  for (const [code, categoryId, nameVi, , sourceUrl] of layerSpecs) {
    await query(
      `
        INSERT INTO map_layer_apis (
          category_id, map_layer_id, name, slug, description, endpoint_url,
          http_method, status, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'GET', 'published', NOW())
        ON CONFLICT (slug) DO UPDATE
        SET category_id = EXCLUDED.category_id,
            map_layer_id = EXCLUDED.map_layer_id,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            endpoint_url = EXCLUDED.endpoint_url,
            status = 'published',
            published_at = COALESCE(map_layer_apis.published_at, NOW()),
            updated_at = NOW()
      `,
      [categoryId, layerIds[code], `${nameVi} API`, `${code}_api`, `API cap du lieu cho lop ${nameVi}`, sourceUrl]
    );
    apiCount += 1;
  }

  return { categoryCount: categorySpecs.length, layerCount: layerSpecs.length, apiCount };
}

async function seedConservation(spots) {
  await query(`
    CREATE TABLE IF NOT EXISTS conservation_areas (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name_vi VARCHAR(255) NOT NULL,
      province_code VARCHAR(20) REFERENCES vn_units.provinces(code),
      geom GEOMETRY(POLYGON, 4326),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS satellite_analysis (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      conservation_id UUID REFERENCES conservation_areas(id) ON DELETE CASCADE,
      change_detected BOOLEAN DEFAULT FALSE,
      change_area_ha NUMERIC(12,2) DEFAULT 0,
      analyzed_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const areaSpecs = [
    ['Khu bao ton dat ngap nuoc Van Long', spots[5] || spots[1], 1.6],
    ['Vung canh quan sinh thai Tam Coc - Bich Dong', spots[7] || spots[2], 0.8],
    ['Vung dem bao ton Cuc Phuong - Nho Quan', spots[3] || spots[0], 2.4],
  ];

  const areaIds = [];
  for (const [name, spot] of areaSpecs) {
    const existing = await query('SELECT id FROM conservation_areas WHERE name_vi = $1 LIMIT 1', [name]);
    let id = existing.rows[0]?.id;
    if (!id) {
      const { rows } = await query(
        `
          INSERT INTO conservation_areas (name_vi, province_code, geom)
          VALUES (
            $1, '37',
            ST_MakeEnvelope($2 - 0.018, $3 - 0.018, $2 + 0.018, $3 + 0.018, 4326)
          )
          RETURNING id
        `,
        [name, Number(spot.lng), Number(spot.lat)]
      );
      id = rows[0].id;
    }
    areaIds.push(id);
  }

  await query('DELETE FROM satellite_analysis WHERE conservation_id = ANY($1::uuid[])', [areaIds]);

  let analysisCount = 0;
  for (let i = 0; i < areaIds.length; i += 1) {
    for (let month = 1; month <= 6; month += 1) {
      const changeDetected = month % (i + 2) === 0;
      await query(
        `
          INSERT INTO satellite_analysis (
            conservation_id, change_detected, change_area_ha, analyzed_at
          ) VALUES ($1, $2, $3, $4::date + INTERVAL '10 hours')
        `,
        [
          areaIds[i],
          changeDetected,
          changeDetected ? Number((0.35 + i * 0.4 + month * 0.08).toFixed(2)) : 0,
          `2026-${String(month).padStart(2, '0')}-20`,
        ]
      );
      analysisCount += 1;
    }
  }

  return { areaCount: areaIds.length, analysisCount };
}

async function seedFeedbacks(businesses, spots, users) {
  const businessRows = [...businesses.values()];
  await query('DELETE FROM citizen_feedbacks WHERE content LIKE $1', [`${REPORT_MARKER}%`]);

  let count = 0;
  for (let i = 0; i < businessRows.length; i += 1) {
    const business = businessRows[i];
    const spot = spots[i % spots.length];
    for (let n = 0; n < 2; n += 1) {
      const lng = Number(spot.lng) + (n + 1) * 0.001;
      const lat = Number(spot.lat) + (n + 1) * 0.001;
      await query(
        `
          INSERT INTO citizen_feedbacks (
            user_id, title, content, latitude, longitude, location_text, geom,
            priority, status, moderation_status, is_location_verified, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4::numeric, $5::numeric, $6,
            ST_SetSRID(ST_MakePoint($5::double precision, $4::double precision), 4326),
            $7, $8, 'approved', TRUE,
            NOW() - ($9::text || ' days')::interval,
            NOW() - ($9::text || ' days')::interval
          )
        `,
        [
          users.department.id,
          n === 0 ? `Can phan luong khach gan ${business.business_name}` : `Gop y ve dich vu tai ${business.business_name}`,
          `${REPORT_MARKER} Phan anh van hanh gan ${business.business_name}, can theo doi tren dashboard doanh nghiep.`,
          lat,
          lng,
          `${spot.name_vi}, Ninh Binh`,
          n === 0 ? 'high' : 'normal',
          n === 0 ? 'in_progress' : 'resolved',
          String(i + n + 1),
        ]
      );
      count += 1;
    }
  }
  return count;
}

async function seedDepartmentReports(users) {
  await query('DELETE FROM generated_reports WHERE title LIKE $1', [`${REPORT_MARKER}%`]);

  let count = 0;
  for (let month = 1; month <= 6; month += 1) {
    await query(
      `
        INSERT INTO generated_reports (
          created_by, report_type, period_from, period_to, title,
          file_url, file_format, file_size_kb, sent_to_roles, generated_at
        ) VALUES (
          $1, 'monthly', $2::date, $3::date, $4,
          $5, 'pdf', $6, $7, $3::date + INTERVAL '18 hours'
        )
      `,
      [
        users.department.id,
        `2026-${String(month).padStart(2, '0')}-01`,
        `2026-${String(month).padStart(2, '0')}-28`,
        `${REPORT_MARKER} Bao cao dieu hanh du lich thang ${month}/2026`,
        `https://storage.dulichninhbinh.vn/reports/qa-dashboard-${month}-2026.pdf`,
        1200 + month * 180,
        [2, 3],
      ]
    );
    count += 1;
  }
  return count;
}

async function seedVisits(users, spots) {
  await query('DELETE FROM user_visit_history WHERE source = $1', [VISIT_SOURCE]);

  const userList = [
    users.admin,
    users.ministry,
    users.department,
    users.spotOperator,
    users.travelCompany,
    users.serviceProvider,
  ].filter(Boolean);

  let count = 0;
  for (let day = 0; day < 30; day += 1) {
    for (let i = 0; i < userList.length; i += 1) {
      const spot = spots[(day + i) % spots.length];
      await query(
        `
          INSERT INTO user_visit_history (
            user_id, spot_id, visited_at, platform, geom, source
          ) VALUES (
            $1, $2,
            NOW() - ($3::text || ' days')::interval + ($4::text || ' hours')::interval,
            $5,
            ST_SetSRID(ST_MakePoint($6, $7), 4326),
            $8
          )
        `,
        [
          userList[i].id,
          spot.id,
          String(day),
          String(8 + (i % 8)),
          i % 2 === 0 ? 'web' : 'mobile',
          Number(spot.lng),
          Number(spot.lat),
          VISIT_SOURCE,
        ]
      );
      count += 1;
    }
  }
  return count;
}

async function main() {
  const users = await loadUsers();
  requireUser(users, 'admin');
  requireUser(users, 'ministry');
  requireUser(users, 'department');
  requireUser(users, 'spotOperator');
  requireUser(users, 'travelCompany');
  requireUser(users, 'serviceProvider');

  const spots = await loadSpots();
  const businesses = await ensureQaBusinesses(users, spots);
  const reportCount = await seedBusinessReports(businesses, users);
  const { serviceCount, capacityCount } = await seedServicesAndCapacity(businesses, spots, users);
  const mapResult = await seedMapData(users);
  const conservationResult = await seedConservation(spots);
  const feedbackCount = await seedFeedbacks(businesses, spots, users);
  const departmentReportCount = await seedDepartmentReports(users);
  const visitCount = await seedVisits(users, spots);

  console.log(JSON.stringify({
    businesses: businesses.size,
    business_activity_reports: reportCount,
    services: serviceCount,
    capacity_logs: capacityCount,
    map_categories: mapResult.categoryCount,
    map_layers: mapResult.layerCount,
    map_layer_apis: mapResult.apiCount,
    conservation_areas: conservationResult.areaCount,
    satellite_analysis: conservationResult.analysisCount,
    citizen_feedbacks: feedbackCount,
    generated_reports: departmentReportCount,
    user_visit_history: visitCount,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
