# Documento deploy 

### ¿Cómo funciona el sistema?
El sistema maneja varios proyectos creados de los cuales puedes registar el nivel de riesgo del proyecto.
Habrá distintos roles, dependiendo de tu rol, tienes acceso a distintias funciones.
- Viewer: El usurio puede consultar el progreso de un proyecto y el nivel de riesgo que este tiene. Solo puede consultar sus proyectos que el está.
- Project manager: El usuario puede consultar y modificar el proyecto suyo. El crea sus proyectos, puede integrar el equipo que quiere trabajar, asignar tareas a su equipo, el agrega notas o avisos del progreso del proyecto y el riesgo que tiene tras ser evaluado por una IA.
- Admin: Es parecido al rol anterior mencionado, pero su diferencia es que este puede checar todos los proyectos que el supervisa a un grupo de project managers.

### ¿Cómo lo ejecuto localmente?
Para ejecutar el software de manera local se deben hacer los pasos:
- Clonar el repositorio (en caso de no tenerlo en tu maquina).
- Instalar las dependencias.
- Configurar el .env con sus keys.
- Crear y migrar la base de datos.
- Correr el servidor (npm run dev).
- Verificar que el programa funcione correctamente.

### ¿Cómo despliego?
Para desplegar el software, se debió cumplir los pasos anteriores.
- Elegir las opciones de hosting, ya sea AWS, Azure, Render, etc.
- Usar las variables de entornos finales (las keys permanentes).
- Desplegar PostgreSQL en producción.
- Correr las migraciones.
- Construir el forntend y conectarlo al backend.

### ¿Por qué se tomaron ciertas decisiones?
Elegimos ciertas tecnologías en general por las facilidades y profesionalismo que son, buscamos usar lenguajes que estén familiarizados la empresa socio.
- React para frontend es un framework de código abierto de Javascript por meta que tiene de ventaja la adaptabiliad que tiene el software respecto en que medio se está desplegando, ya sea una página web o movil.
- Express js para backend es parte de la libreria Javascript, lo que facilita la compatibilidad del frontend y backend, lo elegimos principalmente por lo familiarizados que estamos al comportamiento del framework.
- PostgreSQL es un sistema de gestor de base de datos de código abierto de base de datos, lo elegimos por ser uno de las bases de datos más usados, lo que puede ayudar para proyectos futuros con nuevos desarrolladores el familiarizarse el como funciona.

Todos estos lenguajes se usan por la libertad que nos puede proporcionar y al mismo tiempo la facilidad de programar y entender el comportamiento del código.

### ¿Cómo soluciono errores comunes?
Hacer testing en funciones que puedan ocasionar problemas. Hacer pruebas con un número de usuarios, usar user tester. Errores básicos como:
- ECONNREFUSED -> PostgreSQL no está corriendo. Soución -> Levantar la base de datos y hacer pruebas básicas antes de hacerlas en la aplicación.
- Error de Express.js -> No enciende servidor Express.js. Solución -> Verificar el json y agregar lo que falta.
- Puerto ocupado -> pruerto está siendo utilizado por otro servidor. Solución -> Cambiar el .env por un servidor por otro puerto y los otros programas que usen ese server.-
- Token expired -> El usuario no puede autenticarse. Solución -> Verificar eque la key en el .env sea el mismo en todos los servicios desplegados.