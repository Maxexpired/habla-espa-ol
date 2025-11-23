import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateCertificateHTML = (data: {
  studentName: string;
  courseTitle: string;
  completionDate: string;
  certificateNumber: string;
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificado - ${data.certificateNumber}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Georgia', serif;
      width: 297mm;
      height: 210mm;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .certificate {
      width: 270mm;
      height: 185mm;
      background: white;
      border: 10px solid #2196F3;
      border-radius: 20px;
      position: relative;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      border: 2px solid #64B5F6;
      border-radius: 10px;
      pointer-events: none;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .title {
      font-size: 56px;
      font-weight: bold;
      color: #2196F3;
      letter-spacing: 8px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .subtitle {
      font-size: 20px;
      color: #666;
      letter-spacing: 4px;
    }
    .content {
      text-align: center;
      margin: 40px 0;
    }
    .text {
      font-size: 18px;
      color: #555;
      margin-bottom: 20px;
    }
    .student-name {
      font-size: 42px;
      font-weight: bold;
      color: #1a237e;
      margin: 25px 0;
      border-bottom: 2px solid #2196F3;
      display: inline-block;
      padding-bottom: 10px;
    }
    .course-title {
      font-size: 28px;
      font-weight: bold;
      color: #2196F3;
      margin: 25px 0;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 50px;
      padding: 0 60px;
    }
    .signature {
      text-align: center;
      flex: 1;
    }
    .signature-line {
      width: 200px;
      height: 2px;
      background: #999;
      margin: 0 auto 10px;
    }
    .signature-title {
      font-size: 14px;
      color: #555;
      font-weight: bold;
    }
    .signature-subtitle {
      font-size: 12px;
      color: #888;
    }
    .info {
      text-align: center;
      margin-top: 30px;
    }
    .cert-number {
      font-size: 12px;
      color: #999;
    }
    .date {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
    @media print {
      body {
        background: white;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="title">CERTIFICADO</div>
      <div class="subtitle">DE COMPLETITUD</div>
    </div>
    
    <div class="content">
      <p class="text">Este certificado se otorga a:</p>
      <div class="student-name">${data.studentName}</div>
      <p class="text">por completar exitosamente el curso:</p>
      <div class="course-title">${data.courseTitle}</div>
    </div>
    
    <div class="footer">
      <div class="signature">
        <div class="signature-line"></div>
        <div class="signature-title">Director Académico</div>
        <div class="signature-subtitle">Serene - Plataforma Educativa</div>
      </div>
    </div>
    
    <div class="info">
      <div class="cert-number">Certificado N°: ${data.certificateNumber}</div>
      <div class="date">Fecha de completitud: ${data.completionDate}</div>
    </div>
  </div>
</body>
</html>
  `;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { enrollmentId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        course_id,
        completed_at,
        status,
        profiles:user_id (full_name, email),
        courses:course_id (title, description)
      `)
      .eq('id', enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      throw new Error('Enrollment not found');
    }

    if (enrollment.status !== 'completed') {
      throw new Error('Course not completed yet');
    }

    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from('certificates')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .maybeSingle();

    if (existingCert) {
      return new Response(JSON.stringify({ certificate: existingCert }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate certificate number
    const { data: certNumber } = await supabase
      .rpc('generate_certificate_number');

    const studentName = (enrollment.profiles as any)?.full_name || (enrollment.profiles as any)?.email || 'Estudiante';
    const courseTitle = (enrollment.courses as any)?.title || 'Curso';
    const completionDate = new Date(enrollment.completed_at).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate HTML certificate
    const htmlContent = generateCertificateHTML({
      studentName,
      courseTitle,
      completionDate,
      certificateNumber: certNumber
    });

    // Upload HTML to storage
    const fileName = `certificate-${certNumber}.html`;
    const filePath = `${enrollment.user_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filePath, new Blob([htmlContent], { type: 'text/html' }), {
        contentType: 'text/html',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(filePath);

    // Save certificate record
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .insert({
        enrollment_id: enrollmentId,
        user_id: enrollment.user_id,
        course_id: enrollment.course_id,
        certificate_number: certNumber,
        file_url: urlData.publicUrl
      })
      .select()
      .single();

    if (certError) {
      throw certError;
    }

    return new Response(JSON.stringify({ certificate }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error generating certificate:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate certificate' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
