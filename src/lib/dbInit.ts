/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import User from '../models/User.model.js';
import mongoose from 'mongoose';
import { FooterElementModel } from '../models/FooterElement.model.js';

export const initializeFooterElements = async () => {
  try {
    const count = await FooterElementModel.countDocuments();
    if (count === 0) {
      console.log('[DB-INIT] Inicializando elementos del Footer por defecto...');
      const defaultElements = [
        {
          nombreElemento: "Protección de Datos",
          tituloTexto: "Políticas y Mecanismos de Protección de Datos de Nuestra Plataforma Institucional",
          cuerpoTexto: `En nuestra empresa de diseño y confección textil, la confidencialidad, integridad y disponibilidad de la información de nuestros clientes, aliados comerciales y usuarios del sistema constituyen un pilar fundamental de nuestra excelencia operativa. A través de este documento técnico, exponemos los protocolos, mecanismos de seguridad y el marco legal que rigen el tratamiento de datos dentro de nuestro ecosistema digital.

1. **Cifrado de Extremo a Extremo y Almacenamiento Seguro**
Toda la información suministrada a través de nuestros portales y catálogos internos —incluyendo datos de identificación, especificaciones técnicas de diseño, registros de nómina empresarial y detalles de facturación— es procesada utilizando protocolos de transferencia segura. Implementamos capas de sockets seguros (SSL/TLS) para garantizar que los canales de comunicación entre el usuario y nuestros servidores permanezcan cifrados, impidiendo la interceptación o manipulación de datos por parte de terceros no autorizados.

2. **Marco Legal Nacional: Cumplimiento de la Legislación Venezolana**
Nuestras operaciones digitales se adhieren estrictamente al ordenamiento jurídico de la República Bolivariana de Venezuela en materia de tecnologías de la información. El tratamiento de los datos recolectados cumple con lo establecido en la Constitución de la República Bolivariana de Venezuela (Artículo 60, sobre la protección del honor, vida privada, intimidad y reputación), la Ley Especial Contra los Delitos Informáticos (garantizando la penalización del acceso indebido o sabotaje a sistemas) y las normativas vigentes sobre mensajes de datos y firmas electrónicas.

3. **Estándares y Regulaciones Internacionales**
Con el objetivo de ofrecer un entorno de clase mundial para corporaciones transnacionales y delegaciones de alta competencia, alineamos nuestras políticas de privacidad con las directrices del Reglamento General de Protección de Datos (RGPD) de la Unión Europea y estándares globales equivalentes. Estos principios aseguran la transparencia en la captación de información, la limitación de la finalidad de los datos y la minimización de los registros almacenados en nuestras estructuras de persistencia.

4. **Control de Acceso Basado en Roles (RBAC)**
El acceso a la información dentro del sistema administrativo de la empresa está estrictamente jerarquizado mediante una arquitectura de Control de Acceso Basado en Roles (RBAC). El sistema aísla los componentes de datos sensibles de manera que el personal operativo, diseñadores y agentes de taller únicamente visualizan los parámetros estrictamente necesarios para el proceso de corte y confección. Los módulos críticos como finanzas, usuarios y nóminas permanecen ocultos y protegidos bajo credenciales de alta seguridad reservadas para los roles de Administración y Gerencia.

5. **Integridad Referencial y Disposición Segura de Datos**
Nuestras bases de datos ejecutan rutinas automatizadas de consistencia que impiden la proliferación de registros huérfanos o filtraciones cruzadas. Implementamos políticas estrictas de ciclo de vida del dato: cuando un registro, usuario o presupuesto es eliminado definitivamente por las líneas de mando autorizadas, el sistema ejecuta un borrado en cascada que elimina de forma síncrona y permanente cualquier traza de información en los módulos interconectados, garantizando que no queden réplicas no controladas en el servidor.

6. **Derechos de los Titulares de la Información**
Garantizamos a todos nuestros clientes y usuarios el ejercicio pleno de sus derechos de acceso, rectificación, cancelación y oposición (Derechos ARCO). En cualquier momento, los representantes institucionales pueden solicitar la actualización de sus datos de contacto, la modificación de nóminas asignadas para proyectos textiles o la revocación del acceso al sistema de sus usuarios asociados, modificaciones que se replican en tiempo real en nuestra plataforma para mantener la fidelidad de la información.

7. **Compromiso de Confidencialidad Textil y Corporativa**
Nuestra empresa ratifica que los datos recopilados e imágenes almacenadas en nuestros catálogos internos son utilizados con el fin exclusivo de optimizar la cadena de producción, personalización de indumentaria y automatización de presupuestos. Nos comprometemos formalmente a no comercializar, ceder ni compartir las bases de datos de su personal o clientes con agencias de marketing externas ni terceras entidades, resguardando el patrimonio estratégico y comercial de su organización.`,
          isVisible: true,
          order: 1
        },
        {
          nombreElemento: "Garantía de Calidad",
          tituloTexto: "Nuestra Garantía de Excelencia Textil",
          cuerpoTexto: `### Compromiso de Calidad Internacional
Nuestra empresa garantiza que cada prenda confeccionada cumple con los más altos estándares de resistencia, durabilidad y acabado estético.

*   **Inspección de Materia Prima:** Telas certificadas.
*   **Precisión Tecnológica:** Corte automatizado.
*   **Acabado Artesanal:** Costura de alta resistencia.`,
          isVisible: true,
          order: 2
        },
        {
          nombreElemento: "SOPORTE DE TI",
          tituloTexto: "Soporte Técnico y Asistencia Digital Institucional",
          cuerpoTexto: `### Plataforma de Asistencia Técnica
Para reportar cualquier incidencia técnica o solicitar soporte sobre el uso del sistema administrativo de Publieventos:

*   **Email:** soporte@empresa.com
*   **Horarios:** Lunes a Viernes (8:00 AM - 5:00 PM)
*   **Urgencias:** Canal directo vía WhatsApp Corporativo.`,
          isVisible: true,
          order: 3
        }
      ];
      await FooterElementModel.insertMany(defaultElements);
      console.log('[DB-INIT] Elementos del Footer creados exitosamente.');
    }
  } catch (error) {
    console.error('[DB-INIT] Error al inicializar elementos del Footer:', error);
  }
};

export const initializeAdmin = async () => {
  try {
    // 1. Eliminar colección antigua si el usuario lo solicitó (Migración rápida)
    try {
      const collections = await mongoose.connection.db.listCollections({ name: 'presupuestos' }).toArray();
      if (collections.length > 0) {
        console.log('[DB-INIT] Eliminando colección obsoleta "presupuestos"...');
        await mongoose.connection.db.dropCollection('presupuestos');
      }
    } catch (e) {
      console.log('[DB-INIT] No se pudo limpiar colecciones antiguas:', e);
    }

    const adminEmail = 'mmotal@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      console.log(`[DB-INIT] No se encontró administrador principal. Creando para: ${adminEmail}`);
      const newAdmin = new User({
        nombre: 'Administrador Principal',
        email: adminEmail,
        rol: 0, // Admin
        estado: 'Activo',
        fechaRegistro: new Date()
      });
      await newAdmin.save();
      console.log('[DB-INIT] Administrador principal creado exitosamente.');
    } else {
      console.log(`[DB-INIT] Confirmado: Usuario ${adminEmail} existe y está configurado.`);
    }
  } catch (error) {
    console.error('[DB-INIT] Error al inicializar administrador:', error);
  }
};
