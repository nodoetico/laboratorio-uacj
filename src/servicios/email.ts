import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER;
const EMAIL_TO = process.env.EMAIL_TO || "";

const habilitado = !!(SMTP_HOST && SMTP_USER && SMTP_PASS && EMAIL_TO);

let transporter: nodemailer.Transporter | null = null;

function obtenerTransporte(): nodemailer.Transporter | null {
  if (!habilitado) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

export async function enviarCorreo(asunto: string, texto: string, html?: string) {
  const transport = obtenerTransporte();
  if (!transport) return;

  try {
    await transport.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: asunto,
      text: texto,
      html: html || texto.replace(/\n/g, "<br>"),
    });
  } catch (error) {
    console.error("Error al enviar correo:", error);
  }
}

export async function notificarExperimentoCompletado(
  estudianteNombre: string,
  experimentoTitulo: string,
  experimentoId: number
) {
  const enlace = `${process.env.APP_URL || "https://laboratorio-uacj-production.up.railway.app"}/dashboard/experiments/${experimentoId}`;

  await enviarCorreo(
    `[LabControl] Experimento completado: ${experimentoTitulo}`,
    `El estudiante ${estudianteNombre} ha finalizado el experimento "${experimentoTitulo}".

Puedes ver los resultados en:
${enlace}

--- 
LabControl UACJ - Sistema de Gestión de Laboratorio`,
    `<p>El estudiante <strong>${estudianteNombre}</strong> ha finalizado el experimento <strong>"${experimentoTitulo}"</strong>.</p>
<p>Puedes ver los resultados en:<br><a href="${enlace}">${enlace}</a></p>
<hr><small>LabControl UACJ — Sistema de Gestión de Laboratorio</small>`
  );
}
