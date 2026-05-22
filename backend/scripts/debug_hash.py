from app.core.security import get_password_hash

pw = "123456789"
print('pw bytes', len(pw.encode('utf-8')))
print(get_password_hash(pw))
