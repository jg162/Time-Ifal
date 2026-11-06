import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createPasswordResetToken } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Informe seu e-mail cadastrado.' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email.trim());
    if (!user) {
      // Don't leak user existence or give polite notice
      return NextResponse.json({
        success: true,
        message: 'Se este e-mail estiver cadastrado, as instruções foram enviadas.'
      });
    }

    // Generate 6 digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await createPasswordResetToken(user.email, code);

    // Em ambiente de desenvolvimento local, logamos o código no servidor para testes
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH RECOVERY CODE] E-mail: ${user.email} -> Código: ${code}`);
    }

    // Segurança: Em produção, NUNCA expor o código na resposta HTTP pública
    // para evitar sequestro de contas por terceiros.
    const isDevPreview = process.env.ENABLE_DEV_RECOVERY_CODE === 'true';

    return NextResponse.json({
      success: true,
      message: 'Se este e-mail estiver cadastrado, as instruções e código de verificação foram gerados com segurança.',
      ...(isDevPreview ? { recoveryCode: code, instructions: `[MODO DEV] Código: ${code}` } : {})
    });
  } catch (err: any) {
    console.error('Password recover error:', err);
    return NextResponse.json(
      { error: 'Erro ao gerar recuperação de senha.' },
      { status: 500 }
    );
  }
}
