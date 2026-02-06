export function getAuthErrorMessage(code) {
    switch (code) {
      case "auth/email-already-in-use":
        return "Ya existe una cuenta registrada con ese correo electrónico.";
  
      case "auth/invalid-email":
        return "El correo ingresado no es válido.";
  
      case "auth/weak-password":
        return "La contraseña debe tener al menos 6 caracteres.";
  
      case "auth/user-not-found":
        return "No existe una cuenta con este correo.";
  
      case "auth/wrong-password":
        return "La contraseña es incorrecta.";
  
      case "auth/user-disabled":
        return "Esta cuenta ha sido deshabilitada.";
  
      case "auth/too-many-requests":
        return "Demasiados intentos. Intenta más tarde.";
  
      case "auth/network-request-failed":
        return "Error de conexión. Revisa tu internet.";
  
      default:
        return "Ocurrió un error. Inténtalo nuevamente.";
    }
  }
  