import mysql.connector
import bcrypt
from database.connection import connect

def get_user_by_username(nombre_usuario):
    conn = connect()
    if conn is None:
        return None
    cursor = conn.cursor(dictionary=True)
    try:
        # obtenemos el usuario por su nombre de usuario
        query = "SELECT usuario_id, nombre_usuario, contraseña_hash, rol FROM usuarios WHERE nombre_usuario = %s"
        cursor.execute(query, (nombre_usuario,))
        user = cursor.fetchone()
        return user
    except mysql.connector.Error as e:
        print(f"Error al obtener el usuario: {e}")
        return None
    finally:
        cursor.close()
        conn.close()

def create_user(nombre_usuario, contraseña, email, rol, nombre='', apellidos=''):
    conn = connect()
    if conn is None:
        return False
    cursor = conn.cursor()
    try:
        # usamos bcrypt para hashear la contraseña
        contraseña_hash = bcrypt.hashpw(contraseña.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        query = "INSERT INTO usuarios (nombre_usuario, contraseña_hash, email, rol, nombre, apellidos) VALUES (%s, %s, %s, %s, %s, %s)"
        cursor.execute(query, (nombre_usuario, contraseña_hash, email, rol, nombre, apellidos))
        conn.commit()
        return True
    except mysql.connector.Error as e:
        print(f"Error al crear el usuario: {e}")
        return False
    finally:
        cursor.close()
        conn.close()
