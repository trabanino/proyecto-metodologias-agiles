import tkinter as tk
from tkinter import ttk, messagebox

class ProjectReportApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Project Progress Report Generator")
        self.root.geometry("500x500")  # Tamaño ajustado
        
        # Título con una fuente más grande y centrado
        self.title_label = ttk.Label(self.root, text="Project Progress", font=("Helvetica", 18, "bold"))
        self.title_label.pack(pady=20)
        
        # Sección para ingresar tareas
        self.task_frame = ttk.Frame(self.root)
        self.task_frame.pack(pady=10, padx=20)  # Margen adicional
        
        self.task_label = ttk.Label(self.task_frame, text="Task:")
        self.task_label.grid(row=0, column=0, padx=5, pady=5)
        
        self.task_entry = ttk.Entry(self.task_frame, width=35)  # Más ancho
        self.task_entry.grid(row=0, column=1, padx=5, pady=5)
        
        self.status_label = ttk.Label(self.task_frame, text="Status:")
        self.status_label.grid(row=1, column=0, padx=5, pady=5)
        
        self.status_options = ['Not Started', 'In Progress', 'Completed']
        self.status_var = tk.StringVar(value=self.status_options[0])
        
        self.status_dropdown = ttk.Combobox(self.task_frame, textvariable=self.status_var, values=self.status_options, state='readonly', width=32)
        self.status_dropdown.grid(row=1, column=1, padx=5, pady=5)
        
        self.add_task_button = ttk.Button(self.task_frame, text="Add Task", command=self.add_task)
        self.add_task_button.grid(row=2, columnspan=2, pady=10)
        
        # Sección de lista de tareas
        self.task_list_label = ttk.Label(self.root, text="Task List", font=("Helvetica", 14))
        self.task_list_label.pack(pady=10)
        
        self.task_listbox = tk.Listbox(self.root, width=60, height=7, font=("Arial", 10))  # Más estilo en la lista
        self.task_listbox.pack(pady=5)
        
        # Botón para generar el reporte
        self.generate_button = ttk.Button(self.root, text="Generate Report", command=self.generate_report)
        self.generate_button.pack(pady=20)
        
        # Cuadro de texto para el reporte con más espacio
        self.report_text = tk.Text(self.root, height=10, width=60, state='disabled', bg="#f0f0f0", font=("Arial", 10))
        self.report_text.pack(pady=10)
    
    def add_task(self):
        task = self.task_entry.get()
        status = self.status_var.get()
        if task:
            self.task_listbox.insert(tk.END, f"Task: {task} - Status: {status}")
            self.task_entry.delete(0, tk.END)
            self.status_var.set(self.status_options[0])
        else:
            messagebox.showwarning("Input Error", "Please enter a task.")
    
    def generate_report(self):
        self.report_text.config(state='normal')
        self.report_text.delete(1.0, tk.END)
        report = "Project Progress Report\n\n"
        
        tasks = self.task_listbox.get(0, tk.END)
        if tasks:
            for task in tasks:
                report += task + "\n"
        else:
            report += "No tasks added."
        
        self.report_text.insert(tk.END, report)
        self.report_text.config(state='disabled')


# Ejecutar la app
if __name__ == "__main__":
    root = tk.Tk()
    app = ProjectReportApp(root)
    root.mainloop()
