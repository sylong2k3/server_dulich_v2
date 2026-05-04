const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const UserRepository = require("../models/repositories/user.repository");

function initPassport() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "/api/v1/auth/google/callback";

  if (!clientID || !clientSecret) {
    console.warn("[Passport] GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET chưa được cấu hình — Google OAuth bị tắt.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      { clientID, clientSecret, callbackURL },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const ssoUid = profile.id;
          const displayName = profile.displayName || email;
          const avatar = profile.photos?.[0]?.value;

          // Tìm user theo SSO provider
          let user = await UserRepository.findBySSOProvider("google", ssoUid);

          if (!user && email) {
            // Liên kết với tài khoản email cũ nếu có
            user = await UserRepository.findUserByMailAny(email);
            if (user) {
              await UserRepository.updateUser(user.id, { sso_provider: "google", sso_uid: ssoUid });
              user = await UserRepository.findUserById(user.id);
            }
          }

          if (!user) {
            // Tạo tài khoản mới qua SSO
            user = await UserRepository.createUser({
              email,
              full_name: displayName,
              avatar_url: avatar,
              sso_provider: "google",
              sso_uid: ssoUid,
              is_verified: true,
            });
            // Đặt is_verified = true vì email đã xác thực qua Google
            await UserRepository.updateUser(user.id, { is_verified: true });
            user = await UserRepository.findUserById(user.id);
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await UserRepository.findUserById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}

module.exports = { initPassport };
