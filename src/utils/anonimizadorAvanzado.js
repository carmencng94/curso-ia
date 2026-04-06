// src/utils/anonimizadorAvanzado.js
class AnonimizadorAvanzado {
    constructor() {
        // Reglas simples para detectar datos personales frecuentes.
        this.patrones = {
            // Emails
            email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            // DNI / NIE
            dni: /\b\d{8}[A-Za-z]\b/g,
            nie: /\b[XYZ]\d{7,8}[A-Za-z]\b/g,
            // Telefonos espanoles
            telefono: /\b(?:\+34|0034)?[-\s]?(?:\d{3}[-\s]?\d{3}[-\s]?\d{3}|\d{9})\b/g,
            // Nombres y apellidos (aproximado)
            nombre: /\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3}\b/g
        };
    }

    anonimizar(texto) {
        // Partimos del texto original y vamos sustituyendo datos sensibles paso a paso.
        let limpio = texto;

        // Reemplazamos primero los datos más fáciles de identificar.
        limpio = limpio.replace(this.patrones.email, "[CORREO_CONFIDENCIAL]");
        limpio = limpio.replace(this.patrones.dni, "[DNI_OCULTO]");
        limpio = limpio.replace(this.patrones.nie, "[NIE_OCULTO]");
        limpio = limpio.replace(this.patrones.telefono, "[TELEFONO_OCULTO]");

        // Anonimizar nombres solo si son largos (evita falsos positivos).
        // Esto no es perfecto, pero ayuda a ocultar nombres completos frecuentes.
        limpio = limpio.replace(this.patrones.nombre, (match) => {
            return match.length > 8 ? "[NOMBRE_OCULTO]" : match;
        });

        return limpio;
    }
}

module.exports = AnonimizadorAvanzado;
