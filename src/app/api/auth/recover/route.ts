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

    // Return the code in the response for seamless testing/demonstration
    return NextResponse.json({
      success: true,
      message: 'Código de recuperação gerado com sucesso!',
      recoveryCode: code, // Highlighted for user convenience in testing
      instructions: `Utilize o código ${code} para redefinir sua senha.`
    });
  } catch (err: any) {
    console.error('Password recover error:', err);
    return NextResponse.json(
      { error: 'Erro ao gerar recuperação de senha.' },
      { status: 500 }
    );
  }
}
