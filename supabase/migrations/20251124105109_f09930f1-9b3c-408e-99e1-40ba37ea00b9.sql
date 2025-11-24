-- Insertar los 3 cursos principales
INSERT INTO courses (title, description, topics, published, image_url) VALUES
('Introducción a la Robótica Doméstica', 
'Descubre el fascinante mundo de la robótica aplicada al hogar. Este curso te enseñará desde los conceptos básicos de sensores y actuadores hasta la programación de robots autónomos. Aprenderás a diseñar, construir y programar robots que pueden realizar tareas domésticas, desde la limpieza automatizada hasta sistemas de seguridad inteligentes.

📚 Contenido del curso:
• Fundamentos de robótica y mecatrónica
• Sensores: ultrasonido, infrarrojos, táctiles
• Motores y sistemas de movimiento
• Programación de microcontroladores (Arduino)
• Proyectos prácticos: robot aspirador, brazo robótico
• Integración con sistemas domóticos

🎯 Lo que aprenderás:
- Diseñar circuitos electrónicos básicos
- Programar microcontroladores
- Integrar sensores y actuadores
- Crear proyectos de robótica funcionales
- Resolver problemas técnicos de manera creativa

💡 Proyecto final: Construirás tu propio robot doméstico funcional',
ARRAY['Robótica', 'Arduino', 'Sensores', 'Programación', 'Electrónica', 'IoT'],
true,
'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80'),

('Inteligencia Artificial para Principiantes',
'Adéntrate en el apasionante mundo de la Inteligencia Artificial sin necesidad de conocimientos previos. Aprenderás cómo las máquinas pueden aprender, razonar y tomar decisiones. Este curso te guiará desde los conceptos fundamentales hasta la implementación de algoritmos de IA en proyectos reales.

📚 Contenido del curso:
• Introducción a la IA y Machine Learning
• Redes neuronales artificiales
• Algoritmos de aprendizaje supervisado y no supervisado
• Procesamiento de lenguaje natural (NLP)
• Visión por computadora
• Ética en IA y casos de uso reales

🎯 Lo que aprenderás:
- Fundamentos de Machine Learning
- Crear y entrenar modelos de IA
- Implementar algoritmos de clasificación y predicción
- Trabajar con datasets y preprocesamiento de datos
- Aplicar IA en problemas del mundo real
- Usar bibliotecas como TensorFlow y Scikit-learn

💡 Proyecto final: Desarrollarás un sistema de IA que resuelva un problema real (reconocimiento de imágenes o chatbot inteligente)',
ARRAY['Inteligencia Artificial', 'Machine Learning', 'Python', 'TensorFlow', 'Redes Neuronales', 'Deep Learning'],
true,
'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80'),

('Programación con Python para Proyectos Tecnológicos',
'Python es el lenguaje de programación más demandado en tecnología, robótica e inteligencia artificial. Este curso te llevará desde cero hasta crear tus propios proyectos tecnológicos funcionales. Aprenderás programación de manera práctica y aplicada, con proyectos reales desde la primera clase.

📚 Contenido del curso:
• Fundamentos de Python y programación orientada a objetos
• Estructuras de datos y algoritmos
• Manipulación de archivos y bases de datos
• Librerías científicas: NumPy, Pandas, Matplotlib
• Automatización de tareas
• Creación de interfaces gráficas
• Integración con hardware (Raspberry Pi, Arduino)
• APIs y servicios web

🎯 Lo que aprenderás:
- Programar desde cero en Python
- Crear aplicaciones de escritorio y web
- Automatizar tareas repetitivas
- Trabajar con datos y visualizaciones
- Desarrollar proyectos de IoT y robótica
- Integrar Python con hardware
- Buenas prácticas y código limpio

💡 Proyectos prácticos: 
- Sistema de monitoreo con sensores
- Aplicación web con Flask
- Script de automatización
- Proyecto IoT con Raspberry Pi',
ARRAY['Python', 'Programación', 'IoT', 'Automatización', 'Raspberry Pi', 'Desarrollo Web', 'Bases de Datos'],
true,
'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80');

-- Insertar proyectos de ejemplo
INSERT INTO projects (title, description, image_url, published) VALUES
('Robot Asistente Personal',
'Desarrollo de un robot asistente capaz de realizar tareas domésticas básicas mediante comandos de voz y visión artificial. El proyecto integra múltiples sensores, procesamiento de lenguaje natural y navegación autónoma para crear una solución práctica y funcional para el hogar moderno.',
'https://images.unsplash.com/photo-1563207153-f403bf289096?w=800&q=80',
true),

('Sistema de Monitoreo Inteligente',
'Plataforma IoT completa para monitoreo ambiental y seguridad del hogar. Incluye sensores de temperatura, humedad, movimiento y cámaras inteligentes con reconocimiento facial. Los datos se visualizan en tiempo real mediante una aplicación web intuitiva.',
'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80',
true),

('Chatbot Educativo con IA',
'Asistente virtual inteligente diseñado para responder preguntas sobre tecnología y programación. Utiliza modelos de lenguaje avanzados para proporcionar explicaciones detalladas y ejemplos prácticos, adaptándose al nivel de conocimiento del usuario.',
'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=800&q=80',
true);

-- Insertar noticias de ejemplo
INSERT INTO news (title, description, image_url, published) VALUES
('Lanzamiento de Nuevos Cursos de Robótica',
'Estamos emocionados de anunciar el lanzamiento de nuestra nueva línea de cursos de robótica doméstica. Los estudiantes aprenderán a construir y programar robots funcionales desde cero, con proyectos prácticos y aplicaciones reales en el hogar inteligente.',
'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
true),

('Serene Gana Premio de Innovación Tecnológica',
'Nuestro proyecto de Robot Asistente Personal ha sido reconocido con el Premio Nacional de Innovación Tecnológica 2024. Este logro destaca nuestro compromiso con la excelencia y la innovación en el campo de la robótica educativa.',
'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
true),

('Nueva Alianza con Empresas de Tecnología',
'Hemos establecido alianzas estratégicas con líderes de la industria tecnológica para ofrecer a nuestros estudiantes oportunidades de prácticas profesionales y acceso a las últimas herramientas y plataformas de desarrollo.',
'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
true);