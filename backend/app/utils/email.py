import logging

logger = logging.getLogger("app.email")


def send_verification_email(to_email: str, token: str) -> None:
    """
    Gerçek bir e-posta gönderim sağlayıcısı (SMTP/API) henüz bağlanmadı — karar
    bekleniyor (bkz. docs/missing-services/AUTH.md). Sağlayıcı seçildiğinde bu
    fonksiyonun gövdesi değişecek; çağıran kod (routers/auth.py) aynı kalacak.

    Şimdilik bağlantıyı loglayarak akışın uçtan uca çalıştığını doğrulamayı
    sağlar.
    """
    logger.info("E-posta doğrulama bağlantısı (%s): /email-dogrula?token=%s", to_email, token)
