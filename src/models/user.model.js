class User {
    constructor(data) {
        // Primary
        this.id = data.id;
        this.role_id = data.role_id;
        this.email = data.email;
        this.phone = data.phone;
        this.password_hash = data.password_hash;
        this.full_name = data.full_name;
        this.avatar_url = data.avatar_url;
        // SSO
        this.sso_provider = data.sso_provider;
        this.sso_uid = data.sso_uid;
        // Personal
        this.date_of_birth = data.date_of_birth;
        this.gender = data.gender;
        this.nationality = data.nationality;
        this.preferred_language = data.preferred_language;
        this.preferred_currency = data.preferred_currency;
        this.preferred_distance = data.preferred_distance;
        // Security
        this.is_active = data.is_active;
        this.is_verified = data.is_verified;
        this.two_factor_enabled = data.two_factor_enabled;
        this.last_login_at = data.last_login_at;
        this.last_login_ip = data.last_login_ip;
        // Mobile
        this.fcm_token = data.fcm_token;
        this.apns_token = data.apns_token;
        this.device_os = data.device_os;
        this.app_version = data.app_version;
        // Timestamps
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        // Joined data
        this.role = data.role;
        this.permissions = Array.isArray(data.permissions) ? data.permissions : [];
    }

    toJSON() {
        const userObject = {
            id: this.id,
            email: this.email,
            phone: this.phone,
            full_name: this.full_name,
            avatar_url: this.avatar_url,
            role_id: this.role_id,
            // SSO
            sso_provider: this.sso_provider,
            // Personal
            date_of_birth: this.date_of_birth,
            gender: this.gender,
            nationality: this.nationality,
            preferred_language: this.preferred_language,
            preferred_currency: this.preferred_currency,
            preferred_distance: this.preferred_distance,
            // Security
            is_active: this.is_active,
            is_verified: this.is_verified,
            two_factor_enabled: this.two_factor_enabled,
            last_login_at: this.last_login_at,
            // Mobile
            device_os: this.device_os,
            app_version: this.app_version,
            // Timestamps
            created_at: this.created_at,
            updated_at: this.updated_at,
        };

        if (this.role) {
            userObject.role = {
                id: this.role.id,
                code: this.role.code,
                name_vi: this.role.name_vi,
                name_en: this.role.name_en,
            };
        }

        return userObject;
    }

    // users table in new schema does not contain lock fields
    isLocked() {
        return false;
    }

    getLockInfo() {
        return { isLocked: false, remainingMinutes: 0, lockedUntil: null };
    }

    hasPermission(resource, action) {
        const roleCode = String(this.role?.code || "").toLowerCase();

        // system_admin bypass toàn bộ phân quyền
        if (roleCode === "system_admin") {
            return true;
        }

        // Không có permission nào → từ chối (không bypass)
        if (!Array.isArray(this.permissions) || this.permissions.length === 0) {
            return false;
        }

        const targetResource = String(resource || "").trim().toLowerCase();
        const targetAction = String(action || "").trim().toLowerCase();

        return this.permissions.some((perm) => {
            const permResource = String(perm?.resource || "").trim().toLowerCase();
            const permAction = String(perm?.action || "").trim().toLowerCase();
            return permResource === targetResource && permAction === targetAction;
        });
    }

    static prepareData(data) {
        const prepared = {};
        if (data.email !== undefined) prepared.email = data.email?.trim() || null;
        if (data.password_hash !== undefined) prepared.password_hash = data.password_hash;
        if (data.full_name !== undefined) prepared.full_name = data.full_name?.trim() || null;
        if (data.phone !== undefined) prepared.phone = data.phone?.trim() || null;
        if (data.avatar_url !== undefined) prepared.avatar_url = data.avatar_url?.trim() || null;
        if (data.role_id !== undefined) prepared.role_id = data.role_id;
        if (data.is_active !== undefined) prepared.is_active = data.is_active;
        if (data.is_verified !== undefined) prepared.is_verified = data.is_verified;
        if (data.two_factor_enabled !== undefined) prepared.two_factor_enabled = data.two_factor_enabled;
        // SSO
        if (data.sso_provider !== undefined) prepared.sso_provider = data.sso_provider;
        if (data.sso_uid !== undefined) prepared.sso_uid = data.sso_uid;
        // Personal
        if (data.date_of_birth !== undefined) prepared.date_of_birth = data.date_of_birth;
        if (data.gender !== undefined) prepared.gender = data.gender?.trim() || null;
        if (data.nationality !== undefined) prepared.nationality = data.nationality?.trim() || null;
        if (data.preferred_language !== undefined) prepared.preferred_language = data.preferred_language;
        if (data.preferred_currency !== undefined) prepared.preferred_currency = data.preferred_currency;
        if (data.preferred_distance !== undefined) prepared.preferred_distance = data.preferred_distance;
        // Mobile
        if (data.fcm_token !== undefined) prepared.fcm_token = data.fcm_token;
        if (data.apns_token !== undefined) prepared.apns_token = data.apns_token;
        if (data.device_os !== undefined) prepared.device_os = data.device_os;
        if (data.app_version !== undefined) prepared.app_version = data.app_version;

        Object.keys(prepared).forEach((key) => prepared[key] === undefined && delete prepared[key]);
        return prepared;
    }
}

module.exports = User;
