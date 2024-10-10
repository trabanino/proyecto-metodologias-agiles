from tkinter import messagebox
from database.queries import create_user, get_user_by_username
import re

def handle_register(entry_usuario, entry_contraseña, entry_confirmar_contraseña, entry_email, window):
    nombre_usuario = entry_usuario.get().strip()
    contraseña = entry_contraseña.get()
    confirmar_contraseña = entry_confirmar_contraseña.get()
    email = entry_email.get().strip()

    if not nombre_usuario or not contraseña or not confirmar_contraseña or not email:
        messagebox.showerror("Error", "Por favor, llena todos los campos.")
        return

    if contraseña != confirmar_contraseña:
        messagebox.showerror("Error", "Las contraseñas no coinciden.")
        return

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        messagebox.showerror("Error", "El email no es valido.")
        return

    if get_user_by_username(nombre_usuario):
        messagebox.showerror("Error", "El nombre de usuario ya existe en la BD.")
        return

    rol = "miembro"
    if create_user(nombre_usuario, contraseña, email, rol):
        messagebox.showinfo("Exito", "Usuario registrado!.")
        window.destroy()

        from views.login import open_login_gui
        open_login_gui()
    else:
        messagebox.showerror("Error", "Hubo un error al registrar el usuario.")
