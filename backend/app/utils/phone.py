import phonenumbers


def normalize_phone(raw: str) -> str:
    """Kullanıcı girdisini E164 formatına çevirir, geçersizse ValueError atar."""
    try:
        parsed = phonenumbers.parse(raw, "TR")
    except phonenumbers.NumberParseException:
        raise ValueError("Telefon numarası okunamadı.")

    if not phonenumbers.is_valid_number(parsed):
        raise ValueError("Geçerli bir telefon numarası girin.")

    if phonenumbers.number_type(parsed) not in (
        phonenumbers.PhoneNumberType.MOBILE,
        phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE,
    ):
        raise ValueError("Lütfen bir cep telefonu numarası girin.")

    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)