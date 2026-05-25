# Static RBAC Audit Report

This report contains an automated static analysis of all Express route endpoints in the project to verify that Role-Based Access Control (RBAC) is implemented consistently and securely.

## Route Analysis

| File | Method | Path | Auth? | Permission / Role / Custom | Status |
| --- | --- | --- | --- | --- | --- |
| aframe.route.js | GET | /:id/aframe-scenes | 🔴 No Auth | Public | ⚠️ Check |
| aframe.route.js | POST | /:id/aframe-scenes | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| aframe.route.js | GET | /:id/aframe-scenes/:sceneId | 🔴 No Auth | Public | ⚠️ Check |
| aframe.route.js | PATCH | /:id/aframe-scenes/:sceneId | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| aframe.route.js | DELETE | /:id/aframe-scenes/:sceneId | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| aframe.route.js | PATCH | /:id/aframe-scenes/:sceneId/activate | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| aframe.route.js | PATCH | /:id/aframe-scenes/:sceneId/deactivate | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| aframe.route.js | GET | /:id/aframe-scenes/:sceneId/hotspots | 🔴 No Auth | Public | ⚠️ Check |
| aframe.route.js | POST | /:id/aframe-scenes/:sceneId/hotspots | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| aframe.route.js | PATCH | /:id/aframe-scenes/:sceneId/hotspots/:hotspotId | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| aframe.route.js | DELETE | /:id/aframe-scenes/:sceneId/hotspots/:hotspotId | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| aframe.route.js | PATCH | /:id/aframe-scenes/:sceneId/hotspots/:hotspotId/activate | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| aframe.route.js | PATCH | /:id/aframe-scenes/:sceneId/hotspots/:hotspotId/deactivate | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| aframe.route.js | GET | /:id/aframe-scenes/:sceneId/preload | 🔴 No Auth | Public | ⚠️ Check |
| aframe.route.js | PATCH | /:id/aframe-scenes/:sceneId/set-main | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| ar-session.route.js | POST | / | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| ar-session.route.js | GET | /:id | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| ar-session.route.js | GET | /my | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| ar-session.route.js | GET | /spots/:spotId | 🔒 Authenticated | Permission: `analytics:read` | 🛡️ Full RBAC |
| ar-session.route.js | GET | /stats | 🔒 Authenticated | Permission: `analytics:read` | 🛡️ Full RBAC |
| audit-log.route.js | GET | / | 🔒 Authenticated | Permission: `audit_logs:read` | 🛡️ Full RBAC |
| audit-log.route.js | GET | /visitor-statistics | 🔒 Authenticated | Permission: `audit_logs:read` | 🛡️ Full RBAC |
| auth.route.js | POST | /2fa/disable | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| auth.route.js | POST | /2fa/enable | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| auth.route.js | POST | /2fa/setup | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| auth.route.js | GET | /2fa/status | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| auth.route.js | POST | /2fa/verify-login | 🔴 No Auth | Public | 🚨 HIGH RISK (Public Write) |
| auth.route.js | POST | /change-password | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| auth.route.js | POST | /forgot-password | 🔴 No Auth | Public | 🚨 HIGH RISK (Public Write) |
| auth.route.js | GET | /google | 🔴 No Auth | Public | ⚠️ Check |
| auth.route.js | GET | /google/callback | 🔴 No Auth | Public | ⚠️ Check |
| auth.route.js | POST | /login | 🔴 No Auth | Public | 🚨 HIGH RISK (Public Write) |
| auth.route.js | POST | /logout | 🔓 Optional Auth | Public | 🚨 HIGH RISK (Public Write) |
| auth.route.js | GET | /me | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| auth.route.js | PUT | /me | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| auth.route.js | POST | /refresh | 🔴 No Auth | Public | 🚨 HIGH RISK (Public Write) |
| auth.route.js | POST | /register | 🔴 No Auth | Public | 🚨 HIGH RISK (Public Write) |
| auth.route.js | POST | /reset-password | 🔴 No Auth | Public | 🚨 HIGH RISK (Public Write) |
| auth.route.js | GET | /verify-email/:token | 🔴 No Auth | Public | ⚠️ Check |
| auth.route.js | POST | /verify-email/send | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| business.route.js | POST | / | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| business.route.js | GET | / | 🔒 Authenticated | Permission: `businesses:read` | 🛡️ Full RBAC |
| business.route.js | GET | /:businessId | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| business.route.js | PATCH | /:businessId | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| business.route.js | GET | /:businessId/services | 🔴 No Auth | Public | ⚠️ Check |
| business.route.js | POST | /:businessId/services | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| business.route.js | PATCH | /:businessId/services/:serviceId | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| business.route.js | DELETE | /:businessId/services/:serviceId | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| business.route.js | PATCH | /:businessId/status | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| business.route.js | GET | /:businessId/vouchers | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| business.route.js | POST | /:businessId/vouchers | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| business.route.js | PATCH | /:businessId/vouchers/:voucherId | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| business.route.js | DELETE | /:businessId/vouchers/:voucherId | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| business.route.js | GET | /me | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| business.route.js | GET | /public | 🔴 No Auth | Public | ⚠️ Check |
| business.route.js | GET | /vouchers/nearby | 🔴 No Auth | Public | ⚠️ Check |
| business.route.js | POST | /vouchers/validate | 🔴 No Auth | Public | 🚨 HIGH RISK (Public Write) |
| capacity.route.js | GET | /admin | 🔒 Authenticated | Permission: `capacity:read` | 🛡️ Full RBAC |
| capacity.route.js | GET | /configs | 🔒 Authenticated | Permission: `capacity:read` | 🛡️ Full RBAC |
| capacity.route.js | POST | /configs | 🔒 Authenticated | Permission: `capacity:create` | 🛡️ Full RBAC |
| capacity.route.js | GET | /current | 🔴 No Auth | Public | ⚠️ Check |
| capacity.route.js | GET | /current/geojson | 🔴 No Auth | Public | ⚠️ Check |
| capacity.route.js | GET | /spots/:spotId/alternatives | 🔴 No Auth | Public | ⚠️ Check |
| capacity.route.js | GET | /spots/:spotId/history | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| capacity.route.js | POST | /spots/:spotId/log | 🔒 Authenticated | Permission: `capacity:create` | 🛡️ Full RBAC |
| capacity.route.js | PATCH | /spots/:spotId/settings | 🔒 Authenticated | Permission: `capacity:create` | 🛡️ Full RBAC |
| capacity.route.js | GET | /spots/:spotId/stats | 🔒 Authenticated | Permission: `capacity:read` | 🛡️ Full RBAC |
| capacity.route.js | GET | /stream | 🔴 No Auth | Public | ⚠️ Check |
| chatbot.route.js | POST | /sessions | 🔓 Optional Auth | Public | 🚨 HIGH RISK (Public Write) |
| chatbot.route.js | GET | /sessions | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| chatbot.route.js | GET | /sessions/:sessionId | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| chatbot.route.js | DELETE | /sessions/:sessionId | 🔓 Optional Auth | Public | 🚨 HIGH RISK (Public Write) |
| chatbot.route.js | POST | /sessions/:sessionId/messages | 🔓 Optional Auth | Public | 🚨 HIGH RISK (Public Write) |
| citizen-feedback.route.js | GET | / | 🔴 No Auth | Public | ⚠️ Check |
| citizen-feedback.route.js | POST | / | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| citizen-feedback.route.js | GET | /:id | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| citizen-feedback.route.js | PUT | /:id | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| citizen-feedback.route.js | DELETE | /:id | 🔒 Authenticated | Permission: `feedbacks:delete` | 🛡️ Full RBAC |
| citizen-feedback.route.js | PATCH | /:id/moderation | 🔒 Authenticated | Permission: `feedbacks:update` | 🛡️ Full RBAC |
| citizen-feedback.route.js | PATCH | /:id/status | 🔒 Authenticated | Permission: `feedbacks:update` | 🛡️ Full RBAC |
| citizen-feedback.route.js | GET | /admin/all | 🔒 Authenticated | Permission: `feedbacks:read` | 🛡️ Full RBAC |
| citizen-feedback.route.js | GET | /me | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| culinary.route.js | GET | / | 🔴 No Auth | Public | ⚠️ Check |
| culinary.route.js | POST | / | 🔒 Authenticated | Permission: `culinary:create` | 🛡️ Full RBAC |
| culinary.route.js | GET | /:id | 🔴 No Auth | Public | ⚠️ Check |
| culinary.route.js | PATCH | /:id | 🔒 Authenticated | Permission: `culinary:update` | 🛡️ Full RBAC |
| culinary.route.js | DELETE | /:id | 🔒 Authenticated | Permission: `culinary:delete` | 🛡️ Full RBAC |
| culinary.route.js | GET | /categories | 🔴 No Auth | Public | ⚠️ Check |
| festival.route.js | GET | / | 🔴 No Auth | Public | ⚠️ Check |
| festival.route.js | POST | / | 🔒 Authenticated | Permission: `festivals:create` | 🛡️ Full RBAC |
| festival.route.js | GET | /:id | 🔴 No Auth | Public | ⚠️ Check |
| festival.route.js | PATCH | /:id | 🔒 Authenticated | Permission: `festivals:update` | 🛡️ Full RBAC |
| festival.route.js | DELETE | /:id | 🔒 Authenticated | Permission: `festivals:delete` | 🛡️ Full RBAC |
| festival.route.js | GET | /admin | 🔒 Authenticated | Permission: `festivals:read` | 🛡️ Full RBAC |
| festival.route.js | GET | /admin/:id | 🔒 Authenticated | Permission: `festivals:read` | 🛡️ Full RBAC |
| festival.route.js | GET | /calendar | 🔴 No Auth | Public | ⚠️ Check |
| festival.route.js | GET | /types | 🔴 No Auth | Public | ⚠️ Check |
| geography.route.js | GET | /provinces | 🔴 No Auth | Public | ⚠️ Check |
| geography.route.js | GET | /provinces/:code | 🔴 No Auth | Public | ⚠️ Check |
| geography.route.js | GET | /provinces/:province_code/wards | 🔴 No Auth | Public | ⚠️ Check |
| geography.route.js | GET | /provinces/search | 🔴 No Auth | Public | ⚠️ Check |
| geography.route.js | GET | /wards | 🔴 No Auth | Public | ⚠️ Check |
| geography.route.js | GET | /wards/search | 🔴 No Auth | Public | ⚠️ Check |
| governance.route.js | GET | /admin/dashboard | 🔒 Authenticated | Permission: `governance:read` | 🛡️ Full RBAC |
| governance.route.js | GET | /admin/permissions | 🔒 Authenticated | Permission: `permissions:read` | 🛡️ Full RBAC |
| governance.route.js | POST | /admin/permissions | 🔒 Authenticated | Permission: `permissions:create` | 🛡️ Full RBAC |
| governance.route.js | GET | /admin/roles/:roleId/permissions | 🔒 Authenticated | Permission: `roles:read` | 🛡️ Full RBAC |
| governance.route.js | PUT | /admin/roles/:roleId/permissions | 🔒 Authenticated | Permission: `roles:update` | 🛡️ Full RBAC |
| governance.route.js | GET | /admin/traffic | 🔒 Authenticated | Permission: `governance:read` | 🛡️ Full RBAC |
| governance.route.js | GET | /department/capacity-alerts | 🔒 Authenticated | Permission: `governance:read` | 🛡️ Full RBAC |
| governance.route.js | GET | /department/conservation-summary | 🔒 Authenticated | Permission: `governance:read` | 🛡️ Full RBAC |
| governance.route.js | GET | /department/feedbacks | 🔒 Authenticated | Permission: `governance:read` | 🛡️ Full RBAC |
| governance.route.js | GET | /department/registrations/businesses | 🔒 Authenticated | Permission: `governance:read` | 🛡️ Full RBAC |
| governance.route.js | PATCH | /department/registrations/businesses/:id | 🔒 Authenticated | Permission: `governance:update` | 🛡️ Full RBAC |
| governance.route.js | GET | /department/registrations/spots | 🔒 Authenticated | Permission: `governance:read` | 🛡️ Full RBAC |
| governance.route.js | PATCH | /department/registrations/spots/:id | 🔒 Authenticated | Permission: `governance:update` | 🛡️ Full RBAC |
| governance.route.js | POST | /department/reports | 🔒 Authenticated | Permission: `governance:create` | 🛡️ Full RBAC |
| governance.route.js | GET | /department/reports | 🔒 Authenticated | Permission: `governance:read` | 🛡️ Full RBAC |
| governance.route.js | POST | /department/reports/:id/send | 🔒 Authenticated | Permission: `governance:update` | 🛡️ Full RBAC |
| governance.route.js | PATCH | /enterprise/businesses/:businessId | 🔒 Authenticated | Permission: `governance:update` | 🛡️ Full RBAC |
| governance.route.js | GET | /enterprise/businesses/:businessId/dashboard | 🔒 Authenticated | Permission: `governance:read` | 🛡️ Full RBAC |
| governance.route.js | GET | /enterprise/businesses/:businessId/feedbacks | 🔒 Authenticated | Permission: `governance:read` | 🛡️ Full RBAC |
| governance.route.js | POST | /enterprise/reports | 🔒 Authenticated | Permission: `governance:create` | 🛡️ Full RBAC |
| governance.route.js | GET | /enterprise/reports | 🔒 Authenticated | Permission: `governance:read` | 🛡️ Full RBAC |
| governance.route.js | GET | /ministry/capacity-alerts | 🔒 Authenticated | Permission: `governance:read` | 🛡️ Full RBAC |
| governance.route.js | GET | /ministry/conservation-summary | 🔒 Authenticated | Permission: `governance:read` | 🛡️ Full RBAC |
| governance.route.js | GET | /ministry/overview | 🔒 Authenticated | Permission: `governance:read` | 🛡️ Full RBAC |
| gps.route.js | PATCH | /:trackId/end | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| gps.route.js | POST | /:trackId/sync | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| gps.route.js | POST | /start | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| health.routes.js | GET | / | ❇️ Health Token | Public | ✅ Protected (Token) |
| integration.route.js | GET | / | 🔒 Authenticated | Permission: `integrations:read` | 🛡️ Full RBAC |
| integration.route.js | POST | / | 🔒 Authenticated | Permission: `integrations:create` | 🛡️ Full RBAC |
| integration.route.js | GET | /:id | 🔒 Authenticated | Permission: `integrations:read` | 🛡️ Full RBAC |
| integration.route.js | PATCH | /:id | 🔒 Authenticated | Permission: `integrations:update` | 🛡️ Full RBAC |
| integration.route.js | DELETE | /:id | 🔒 Authenticated | Permission: `integrations:delete` | 🛡️ Full RBAC |
| integration.route.js | GET | /:id/logs | 🔒 Authenticated | Permission: `integrations:read` | 🛡️ Full RBAC |
| integration.route.js | POST | /:id/sync | 🔒 Authenticated | Permission: `integrations:update` | 🛡️ Full RBAC |
| itinerary.route.js | POST | / | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| itinerary.route.js | GET | /:id | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| itinerary.route.js | PATCH | /:id | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| itinerary.route.js | DELETE | /:id | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| itinerary.route.js | GET | /:id/days | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| itinerary.route.js | POST | /:id/days | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| itinerary.route.js | PATCH | /:id/days/:dayId | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| itinerary.route.js | DELETE | /:id/days/:dayId | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| itinerary.route.js | POST | /:id/days/:dayId/stops | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| itinerary.route.js | GET | /:id/export/pdf | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| itinerary.route.js | POST | /:id/share | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| itinerary.route.js | DELETE | /:id/share | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| itinerary.route.js | PATCH | /:id/stops/:stopId | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| itinerary.route.js | DELETE | /:id/stops/:stopId | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| itinerary.route.js | POST | /ai-generate | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| itinerary.route.js | GET | /my | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| itinerary.route.js | GET | /shared/:token | 🔴 No Auth | Public | ⚠️ Check |
| map-admin.route.js | GET | /api-keys | 🔒 Authenticated | Permission: `map_admin:read` | 🛡️ Full RBAC |
| map-admin.route.js | POST | /api-keys | 🔒 Authenticated | Permission: `map_admin:create` | 🛡️ Full RBAC |
| map-admin.route.js | PATCH | /api-keys/:id/revoke | 🔒 Authenticated | Permission: `map_admin:update` | 🛡️ Full RBAC |
| map-admin.route.js | GET | /apis | 🔒 Authenticated | Permission: `map_admin:read` | 🛡️ Full RBAC |
| map-admin.route.js | POST | /apis | 🔒 Authenticated | Permission: `map_admin:create` | 🛡️ Full RBAC |
| map-admin.route.js | PATCH | /apis/:id | 🔒 Authenticated | Permission: `map_admin:update` | 🛡️ Full RBAC |
| map-admin.route.js | DELETE | /apis/:id | 🔒 Authenticated | Permission: `map_admin:delete` | 🛡️ Full RBAC |
| map-admin.route.js | GET | /apis/:id/permissions | 🔒 Authenticated | Permission: `map_admin:read` | 🛡️ Full RBAC |
| map-admin.route.js | PUT | /apis/:id/permissions | 🔒 Authenticated | Permission: `map_admin:update` | 🛡️ Full RBAC |
| map-admin.route.js | DELETE | /apis/:id/permissions/:permissionId | 🔒 Authenticated | Permission: `map_admin:delete` | 🛡️ Full RBAC |
| map-admin.route.js | GET | /categories | 🔒 Authenticated | Permission: `map_admin:read` | 🛡️ Full RBAC |
| map-admin.route.js | POST | /categories | 🔒 Authenticated | Permission: `map_admin:create` | 🛡️ Full RBAC |
| map-admin.route.js | PATCH | /categories/:id | 🔒 Authenticated | Permission: `map_admin:update` | 🛡️ Full RBAC |
| map-admin.route.js | DELETE | /categories/:id | 🔒 Authenticated | Permission: `map_admin:delete` | 🛡️ Full RBAC |
| map-admin.route.js | GET | /layers | 🔒 Authenticated | Permission: `map_admin:read` | 🛡️ Full RBAC |
| map-admin.route.js | POST | /layers | 🔒 Authenticated | Permission: `map_admin:create` | 🛡️ Full RBAC |
| map-admin.route.js | PATCH | /layers/:id | 🔒 Authenticated | Permission: `map_admin:update` | 🛡️ Full RBAC |
| map-admin.route.js | DELETE | /layers/:id | 🔒 Authenticated | Permission: `map_admin:delete` | 🛡️ Full RBAC |
| map-admin.route.js | PATCH | /layers/:id/toggle | 🔒 Authenticated | Permission: `map_admin:update` | 🛡️ Full RBAC |
| map-data.route.js | GET | /apis | 🔴 No Auth | Public | ⚠️ Check |
| map-data.route.js | GET | /apis/:apiId/data | 🔑 API Key | Public | ✅ Protected (API) |
| map-data.route.js | GET | /layers | 🔴 No Auth | Public | ⚠️ Check |
| map-measure.route.js | POST | /area | 🔴 No Auth | Public | 🚨 HIGH RISK (Public Write) |
| map-measure.route.js | POST | /distance | 🔴 No Auth | Public | 🚨 HIGH RISK (Public Write) |
| news.route.js | GET | / | 🔴 No Auth | Public | ⚠️ Check |
| news.route.js | POST | / | 🔒 Authenticated | Permission: `news:create` | 🛡️ Full RBAC |
| news.route.js | PATCH | /:id | 🔒 Authenticated | Permission: `news:update` | 🛡️ Full RBAC |
| news.route.js | DELETE | /:id | 🔒 Authenticated | Permission: `news:delete` | 🛡️ Full RBAC |
| news.route.js | GET | /:id/comments | 🔴 No Auth | Public | ⚠️ Check |
| news.route.js | POST | /:id/comments | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| news.route.js | PATCH | /:id/comments/:commentId | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| news.route.js | DELETE | /:id/comments/:commentId | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| news.route.js | PATCH | /:id/comments/:commentId/approval | 🔒 Authenticated | Permission: `news:update` | 🛡️ Full RBAC |
| news.route.js | GET | /:slug | 🔴 No Auth | Public | ⚠️ Check |
| news.route.js | GET | /admin/:id | 🔒 Authenticated | Permission: `news:read` | 🛡️ Full RBAC |
| news.route.js | PATCH | /admin/:id/publish | 🔒 Authenticated | Permission: `news:update` | 🛡️ Full RBAC |
| news.route.js | GET | /admin/all | 🔒 Authenticated | Permission: `news:read` | 🛡️ Full RBAC |
| notification.route.js | POST | / | 🔒 Authenticated | Permission: `notifications:create` | 🛡️ Full RBAC |
| notification.route.js | DELETE | / | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| notification.route.js | DELETE | /:id | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| notification.route.js | PATCH | /:id/read | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| notification.route.js | GET | /me | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| notification.route.js | PATCH | /read-all | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| notification.route.js | GET | /unread-count | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| ocop.route.js | GET | / | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| ocop.route.js | POST | / | 🔒 Authenticated | Permission: `ocop:create` | 🛡️ Full RBAC |
| ocop.route.js | GET | /:id | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| ocop.route.js | PATCH | /:id | 🔒 Authenticated | Permission: `ocop:update` | 🛡️ Full RBAC |
| ocop.route.js | DELETE | /:id | 🔒 Authenticated | Permission: `ocop:delete` | 🛡️ Full RBAC |
| ocop.route.js | GET | /categories | 🔴 No Auth | Public | ⚠️ Check |
| ocop.route.js | GET | /geojson | 🔴 No Auth | Public | ⚠️ Check |
| ocop.route.js | GET | /me | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| ocop.route.js | GET | /spot/:id | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| offline.route.js | GET | / | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| offline.route.js | GET | /:id | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| offline.route.js | DELETE | /:id | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| offline.route.js | POST | /download | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| rating.route.js | GET | / | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| rating.route.js | POST | / | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| rating.route.js | PATCH | /:id | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| rating.route.js | DELETE | /:id | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| rating.route.js | POST | /:id/helpful | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| rating.route.js | POST | /:id/reply | 🔒 Authenticated | Permission: `ratings:update` | 🛡️ Full RBAC |
| rating.route.js | PATCH | /:id/status | 🔒 Authenticated | Permission: `ratings:delete` | 🛡️ Full RBAC |
| rating.route.js | GET | /business/my | 🔒 Authenticated | Permission: `ratings:read` | 🛡️ Full RBAC |
| role.route.js | GET | / | 🔒 Authenticated | Permission: `roles:read` | 🛡️ Full RBAC |
| role.route.js | POST | / | 🔒 Authenticated | Permission: `roles:create` | 🛡️ Full RBAC |
| role.route.js | GET | /:id | 🔒 Authenticated | Permission: `roles:read` | 🛡️ Full RBAC |
| role.route.js | PUT | /:id | 🔒 Authenticated | Permission: `roles:update` | 🛡️ Full RBAC |
| role.route.js | DELETE | /:id | 🔒 Authenticated | Permission: `roles:delete` | 🛡️ Full RBAC |
| search.route.js | GET | / | 🔴 No Auth | Public | ⚠️ Check |
| search.route.js | GET | /:type | 🔴 No Auth | Public | ⚠️ Check |
| search.route.js | GET | /types | 🔴 No Auth | Public | ⚠️ Check |
| spot-category.route.js | GET | / | 🔒 Authenticated | Permission: `spot_categories:read` | 🛡️ Full RBAC |
| spot-category.route.js | POST | / | 🔒 Authenticated | Permission: `spot_categories:create` | 🛡️ Full RBAC |
| spot-category.route.js | GET | /:id | 🔒 Authenticated | Permission: `spot_categories:read` | 🛡️ Full RBAC |
| spot-category.route.js | PUT | /:id | 🔒 Authenticated | Permission: `spot_categories:update` | 🛡️ Full RBAC |
| spot-category.route.js | DELETE | /:id | 🔒 Authenticated | Permission: `spot_categories:delete` | 🛡️ Full RBAC |
| spot-category.route.js | PATCH | /:id/toggle | 🔒 Authenticated | Permission: `spot_categories:update` | 🛡️ Full RBAC |
| spot-category.route.js | GET | /tree | 🔴 No Auth | Public | ⚠️ Check |
| spot.route.js | GET | / | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| spot.route.js | POST | / | 🔒 Authenticated | Permission: `spots:create` | 🛡️ Full RBAC |
| spot.route.js | PATCH | /:id | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| spot.route.js | DELETE | /:id | 🔒 Authenticated | Permission: `spots:delete` | 🛡️ Full RBAC |
| spot.route.js | GET | /:id/audio-guide | 🔴 No Auth | Public | ⚠️ Check |
| spot.route.js | PATCH | /:id/featured | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| spot.route.js | GET | /:id/media | 🔴 No Auth | Public | ⚠️ Check |
| spot.route.js | POST | /:id/media | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| spot.route.js | DELETE | /:id/media/:mediaId | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| spot.route.js | PATCH | /:id/media/:mediaId | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| spot.route.js | PATCH | /:id/media/:mediaId/primary | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| spot.route.js | POST | /:id/media/batch | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| spot.route.js | GET | /:slug | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| spot.route.js | GET | /bbox | 🔴 No Auth | Public | ⚠️ Check |
| spot.route.js | GET | /featured | 🔴 No Auth | Public | ⚠️ Check |
| spot.route.js | GET | /geojson | 🔴 No Auth | Public | ⚠️ Check |
| spot.route.js | GET | /id/:id | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| spot.route.js | GET | /map | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| spot.route.js | GET | /nearby | 🔴 No Auth | Public | ⚠️ Check |
| statistics.route.js | GET | /data-files | 🔒 Authenticated | Permission: `analytics:read` | 🛡️ Full RBAC |
| statistics.route.js | GET | /data-files/download/:filename | 🔒 Authenticated | Permission: `analytics:read` | 🛡️ Full RBAC |
| tour.route.js | GET | / | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| tour.route.js | POST | / | 🔒 Authenticated | Permission: `tours:create` | 🛡️ Full RBAC |
| tour.route.js | GET | /:id | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| tour.route.js | PATCH | /:id | 🔒 Authenticated | Permission: `tours:update` | 🛡️ Full RBAC |
| tour.route.js | DELETE | /:id | 🔒 Authenticated | Permission: `tours:delete` | 🛡️ Full RBAC |
| tour.route.js | GET | /:id/stops | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| tour.route.js | POST | /:id/stops | 🔒 Authenticated | Permission: `tours:update` | 🛡️ Full RBAC |
| tour.route.js | PATCH | /:id/stops/:stopId | 🔒 Authenticated | Permission: `tours:update` | 🛡️ Full RBAC |
| tour.route.js | DELETE | /:id/stops/:stopId | 🔒 Authenticated | Permission: `tours:update` | 🛡️ Full RBAC |
| tour.route.js | PATCH | /:id/stops/reorder | 🔒 Authenticated | Permission: `tours:update` | 🛡️ Full RBAC |
| tour.route.js | GET | /slug/:slug | 🔓 Optional Auth | Public | ℹ️ Public / Opt-Auth |
| user.route.js | GET | / | 🔒 Authenticated | Permission: `users:read` | 🛡️ Full RBAC |
| user.route.js | POST | / | 🔒 Authenticated | Permission: `users:create` | 🛡️ Full RBAC |
| user.route.js | GET | /:id | 🔒 Authenticated | Permission: `users:read` | 🛡️ Full RBAC |
| user.route.js | PUT | /:id | 🔒 Authenticated | Permission: `users:update` | 🛡️ Full RBAC |
| user.route.js | DELETE | /:id | 🔒 Authenticated | Permission: `users:delete` | 🛡️ Full RBAC |
| user.route.js | PATCH | /:id/lock | 🔒 Authenticated | Permission: `users:update` | 🛡️ Full RBAC |
| user.route.js | PUT | /:id/role | 🔒 Authenticated | Permission: `users:update` | 🛡️ Full RBAC |
| user.route.js | DELETE | /batch | 🔒 Authenticated | Permission: `users:delete` | 🛡️ Full RBAC |
| vlog.route.js | GET | / | 🔴 No Auth | Public | ⚠️ Check |
| vlog.route.js | POST | / | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| vlog.route.js | GET | /:id | 🔴 No Auth | Public | ⚠️ Check |
| vlog.route.js | PATCH | /:id | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| vlog.route.js | DELETE | /:id | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| vlog.route.js | GET | /:id/comments | 🔴 No Auth | Public | ⚠️ Check |
| vlog.route.js | POST | /:id/comments | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| vlog.route.js | DELETE | /:id/comments/:commentId | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| vlog.route.js | PUT | /:id/like | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| vlog.route.js | DELETE | /:id/like | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| vlog.route.js | PUT | /:id/save | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| vlog.route.js | DELETE | /:id/save | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| vlog.route.js | GET | /admin/:id | 🔒 Authenticated | Permission: `vlogs:read` | 🛡️ Full RBAC |
| vlog.route.js | PATCH | /admin/:id/moderate | 🔒 Authenticated | Permission: `vlogs:update` | 🛡️ Full RBAC |
| vlog.route.js | GET | /admin/all | 🔒 Authenticated | Permission: `vlogs:read` | 🛡️ Full RBAC |
| vlog.route.js | GET | /user/saved | 🔒 Authenticated | Auth Token Only | ⚠️ Auth Only (No RBAC) |
| vr-hotspot.route.js | GET | /:id/media/:mediaId/hotspots | 🔴 No Auth | Public | ⚠️ Check |
| vr-hotspot.route.js | POST | /:id/media/:mediaId/hotspots | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| vr-hotspot.route.js | PATCH | /:id/media/:mediaId/hotspots/:hotspotId | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |
| vr-hotspot.route.js | DELETE | /:id/media/:mediaId/hotspots/:hotspotId | 🔒 Authenticated | Permission: `spots:update` | 🛡️ Full RBAC |

## Summary Statistics

- **🛡️ RBAC / Role Enforced Endpoints:** 141
- **⚠️ Auth-Only (No RBAC checks):** 70
- **ℹ️ Public / Optional-Auth Endpoints:** 84
- **🚨 High Risk (Public Write Endpoints):** 13

## Findings and Recommendations

### 🚨 High Risk public write endpoints:
- **auth.route.js**: `POST /2fa/verify-login` is public and modifies state! Needs immediate attention.
- **auth.route.js**: `POST /forgot-password` is public and modifies state! Needs immediate attention.
- **auth.route.js**: `POST /login` is public and modifies state! Needs immediate attention.
- **auth.route.js**: `POST /logout` is public and modifies state! Needs immediate attention.
- **auth.route.js**: `POST /refresh` is public and modifies state! Needs immediate attention.
- **auth.route.js**: `POST /register` is public and modifies state! Needs immediate attention.
- **auth.route.js**: `POST /reset-password` is public and modifies state! Needs immediate attention.
- **business.route.js**: `POST /vouchers/validate` is public and modifies state! Needs immediate attention.
- **chatbot.route.js**: `POST /sessions` is public and modifies state! Needs immediate attention.
- **chatbot.route.js**: `DELETE /sessions/:sessionId` is public and modifies state! Needs immediate attention.
- **chatbot.route.js**: `POST /sessions/:sessionId/messages` is public and modifies state! Needs immediate attention.
- **map-measure.route.js**: `POST /area` is public and modifies state! Needs immediate attention.
- **map-measure.route.js**: `POST /distance` is public and modifies state! Needs immediate attention.

### ⚠️ Auth-only endpoints without permission checks:
- **ar-session.route.js**: `POST /` requires authentication but has no RBAC roles or permission checks.
- **ar-session.route.js**: `GET /:id` requires authentication but has no RBAC roles or permission checks.
- **ar-session.route.js**: `GET /my` requires authentication but has no RBAC roles or permission checks.
- **auth.route.js**: `POST /2fa/disable` requires authentication but has no RBAC roles or permission checks.
- **auth.route.js**: `POST /2fa/enable` requires authentication but has no RBAC roles or permission checks.
- **auth.route.js**: `POST /2fa/setup` requires authentication but has no RBAC roles or permission checks.
- **auth.route.js**: `GET /2fa/status` requires authentication but has no RBAC roles or permission checks.
- **auth.route.js**: `POST /change-password` requires authentication but has no RBAC roles or permission checks.
- **auth.route.js**: `GET /me` requires authentication but has no RBAC roles or permission checks.
- **auth.route.js**: `PUT /me` requires authentication but has no RBAC roles or permission checks.
- **auth.route.js**: `POST /verify-email/send` requires authentication but has no RBAC roles or permission checks.
- **business.route.js**: `POST /` requires authentication but has no RBAC roles or permission checks.
- **business.route.js**: `PATCH /:businessId` requires authentication but has no RBAC roles or permission checks.
- **business.route.js**: `POST /:businessId/services` requires authentication but has no RBAC roles or permission checks.
- **business.route.js**: `PATCH /:businessId/services/:serviceId` requires authentication but has no RBAC roles or permission checks.
- **business.route.js**: `DELETE /:businessId/services/:serviceId` requires authentication but has no RBAC roles or permission checks.
- **business.route.js**: `PATCH /:businessId/status` requires authentication but has no RBAC roles or permission checks.
- **business.route.js**: `GET /:businessId/vouchers` requires authentication but has no RBAC roles or permission checks.
- **business.route.js**: `POST /:businessId/vouchers` requires authentication but has no RBAC roles or permission checks.
- **business.route.js**: `PATCH /:businessId/vouchers/:voucherId` requires authentication but has no RBAC roles or permission checks.
- **business.route.js**: `DELETE /:businessId/vouchers/:voucherId` requires authentication but has no RBAC roles or permission checks.
- **business.route.js**: `GET /me` requires authentication but has no RBAC roles or permission checks.
- **capacity.route.js**: `GET /spots/:spotId/history` requires authentication but has no RBAC roles or permission checks.
- **citizen-feedback.route.js**: `POST /` requires authentication but has no RBAC roles or permission checks.
- **citizen-feedback.route.js**: `PUT /:id` requires authentication but has no RBAC roles or permission checks.
- **citizen-feedback.route.js**: `GET /me` requires authentication but has no RBAC roles or permission checks.
- **gps.route.js**: `PATCH /:trackId/end` requires authentication but has no RBAC roles or permission checks.
- **gps.route.js**: `POST /:trackId/sync` requires authentication but has no RBAC roles or permission checks.
- **gps.route.js**: `POST /start` requires authentication but has no RBAC roles or permission checks.
- **itinerary.route.js**: `POST /` requires authentication but has no RBAC roles or permission checks.
- **itinerary.route.js**: `PATCH /:id` requires authentication but has no RBAC roles or permission checks.
- **itinerary.route.js**: `DELETE /:id` requires authentication but has no RBAC roles or permission checks.
- **itinerary.route.js**: `POST /:id/days` requires authentication but has no RBAC roles or permission checks.
- **itinerary.route.js**: `PATCH /:id/days/:dayId` requires authentication but has no RBAC roles or permission checks.
- **itinerary.route.js**: `DELETE /:id/days/:dayId` requires authentication but has no RBAC roles or permission checks.
- **itinerary.route.js**: `POST /:id/days/:dayId/stops` requires authentication but has no RBAC roles or permission checks.
- **itinerary.route.js**: `POST /:id/share` requires authentication but has no RBAC roles or permission checks.
- **itinerary.route.js**: `DELETE /:id/share` requires authentication but has no RBAC roles or permission checks.
- **itinerary.route.js**: `PATCH /:id/stops/:stopId` requires authentication but has no RBAC roles or permission checks.
- **itinerary.route.js**: `DELETE /:id/stops/:stopId` requires authentication but has no RBAC roles or permission checks.
- **itinerary.route.js**: `POST /ai-generate` requires authentication but has no RBAC roles or permission checks.
- **itinerary.route.js**: `GET /my` requires authentication but has no RBAC roles or permission checks.
- **news.route.js**: `POST /:id/comments` requires authentication but has no RBAC roles or permission checks.
- **news.route.js**: `PATCH /:id/comments/:commentId` requires authentication but has no RBAC roles or permission checks.
- **news.route.js**: `DELETE /:id/comments/:commentId` requires authentication but has no RBAC roles or permission checks.
- **notification.route.js**: `DELETE /` requires authentication but has no RBAC roles or permission checks.
- **notification.route.js**: `DELETE /:id` requires authentication but has no RBAC roles or permission checks.
- **notification.route.js**: `PATCH /:id/read` requires authentication but has no RBAC roles or permission checks.
- **notification.route.js**: `GET /me` requires authentication but has no RBAC roles or permission checks.
- **notification.route.js**: `PATCH /read-all` requires authentication but has no RBAC roles or permission checks.
- **notification.route.js**: `GET /unread-count` requires authentication but has no RBAC roles or permission checks.
- **ocop.route.js**: `GET /me` requires authentication but has no RBAC roles or permission checks.
- **offline.route.js**: `GET /` requires authentication but has no RBAC roles or permission checks.
- **offline.route.js**: `GET /:id` requires authentication but has no RBAC roles or permission checks.
- **offline.route.js**: `DELETE /:id` requires authentication but has no RBAC roles or permission checks.
- **offline.route.js**: `POST /download` requires authentication but has no RBAC roles or permission checks.
- **rating.route.js**: `POST /` requires authentication but has no RBAC roles or permission checks.
- **rating.route.js**: `PATCH /:id` requires authentication but has no RBAC roles or permission checks.
- **rating.route.js**: `DELETE /:id` requires authentication but has no RBAC roles or permission checks.
- **rating.route.js**: `POST /:id/helpful` requires authentication but has no RBAC roles or permission checks.
- **vlog.route.js**: `POST /` requires authentication but has no RBAC roles or permission checks.
- **vlog.route.js**: `PATCH /:id` requires authentication but has no RBAC roles or permission checks.
- **vlog.route.js**: `DELETE /:id` requires authentication but has no RBAC roles or permission checks.
- **vlog.route.js**: `POST /:id/comments` requires authentication but has no RBAC roles or permission checks.
- **vlog.route.js**: `DELETE /:id/comments/:commentId` requires authentication but has no RBAC roles or permission checks.
- **vlog.route.js**: `PUT /:id/like` requires authentication but has no RBAC roles or permission checks.
- **vlog.route.js**: `DELETE /:id/like` requires authentication but has no RBAC roles or permission checks.
- **vlog.route.js**: `PUT /:id/save` requires authentication but has no RBAC roles or permission checks.
- **vlog.route.js**: `DELETE /:id/save` requires authentication but has no RBAC roles or permission checks.
- **vlog.route.js**: `GET /user/saved` requires authentication but has no RBAC roles or permission checks.
