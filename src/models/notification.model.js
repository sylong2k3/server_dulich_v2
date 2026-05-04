class Notification {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.target_roles = data.target_roles;
    this.target_geom = data.target_geom;
    this.target_radius_m = data.target_radius_m;
    this.type = data.type;
    this.title_vi = data.title_vi;
    this.body_vi = data.body_vi;
    this.data = data.data;
    this.sent_at = data.sent_at;
    this.delivery_status = data.delivery_status;
    this.read_at = data.read_at;
    this.triggered_by = data.triggered_by;
    this.created_at = data.created_at;
  }

  get is_read() {
    return this.read_at !== null && this.read_at !== undefined;
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      target_roles: this.target_roles,
      target_geom: this.target_geom,
      target_radius_m: this.target_radius_m,
      type: this.type,
      title_vi: this.title_vi,
      body_vi: this.body_vi,
      data: this.data,
      sent_at: this.sent_at,
      delivery_status: this.delivery_status,
      read_at: this.read_at,
      is_read: this.is_read,
      triggered_by: this.triggered_by,
      created_at: this.created_at,
    };
  }
}

module.exports = Notification;
