import bcrypt
from tkinter import messagebox
from database.queries import get_user_by_username


def handle_login(entry_usuario, entry_contraseña, window):
    nombre_usuario = entry_usuario.get()
    contraseña = entry_contraseña.get()

    if not nombre_usuario or not contraseña:
        messagebox.showerror("Error", "Por favor, ingresa tu usuario y contraseña.")
        return

    user = get_user_by_username(nombre_usuario)
    if user is None:
        messagebox.showerror("Error", "Usuario no encontrado.")
        return

    contraseña_hash = user['contraseña_hash']

    if bcrypt.checkpw(contraseña.encode('utf-8'), contraseña_hash.encode('utf-8')):
        messagebox.showinfo("Exito", f"Bienvenido, {user['nombre_usuario']}!")
        window.destroy()

    else:
        messagebox.showerror("Error", "Contraseña incorrecta.")
