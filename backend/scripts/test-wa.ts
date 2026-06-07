import { sendMessage } from '../src/services/whatsapp.service';
import { interpolateMessage } from '../src/utils/interpolate';

async function main() {
  const phone = process.argv[2] ?? '5521987620966';

  // Testa a interpolação de variáveis (mesma usada nas campanhas/jobs)
  const msg = interpolateMessage(
    '✅ *Teste do sistema Volunteer Vantagens*\n\n📅 Data: {{date}}\n⏰ Horário: {{startTime}} — {{endTime}}\n⭐ Pontuação: {{points}} pontos\n\nSe você recebeu esta mensagem, a integração WhatsApp está funcionando!',
    {
      date: new Date(),
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      points: 350,
      windowMinutes: 10,
    }
  );

  console.log('--- Mensagem interpolada ---');
  console.log(msg);
  console.log('--- Enviando para', phone, '---');

  await sendMessage(phone, msg);
  console.log('Envio concluído (sem exceção).');
}

main().then(() => process.exit(0)).catch((e) => { console.error('ERRO:', e); process.exit(1); });
