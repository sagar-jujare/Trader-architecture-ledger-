import 'server-only';

export type Delivery = { email: 'sent'|'not_configured'|'failed'; whatsapp: 'sent'|'not_configured'|'failed'; notes: string[] };

function errorMessage(response: Response, text: string) {
  return `HTTP ${response.status}: ${text.slice(0, 240)}`;
}

export function whatsappShareUrl(phone: string | null | undefined, inviteLink: string, name: string) {
  const digits = (phone || '').replace(/\D/g, '');
  const text = `Hello ${name}, you've been invited to Trader Architecture Ledger. Set up your account using this private link (expires in 48 hours): ${inviteLink}`;
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
}

export async function sendInvitation(args: {email:string; name:string; phone:string; link:string}): Promise<Delivery> {
  const result: Delivery = {email:'not_configured', whatsapp:'not_configured', notes:[]};
  const tasks: Promise<void>[] = [];
  if (process.env.RESEND_API_KEY && process.env.INVITE_FROM_EMAIL) {
    tasks.push((async()=>{
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method:'POST',
          headers:{'Authorization':`Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type':'application/json'},
          body: JSON.stringify({
            from:process.env.INVITE_FROM_EMAIL,
            to:[args.email],
            subject:'Your Trader Architecture Ledger invitation',
            text:`Hello ${args.name},\n\nYou have been invited to Trader Architecture Ledger. Set up your account using this one-time link (expires in 48 hours):\n${args.link}\n\nIf you weren't expecting this, ignore this message.`,
          }),
          cache:'no-store',
        });
        if (!response.ok) throw new Error(errorMessage(response, await response.text()));
        result.email='sent';
      } catch(e) {result.email='failed'; result.notes.push('Email: '+(e instanceof Error ? e.message : 'Unknown provider error'));}
    })());
  }
  // WhatsApp Cloud API requires an approved template for business-initiated conversations.
  // The template must contain two BODY parameters: recipient name and invitation URL.
  if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_INVITE_TEMPLATE) {
    tasks.push((async()=>{
      try {
        const digits=args.phone.replace(/\D/g,'');
        if (digits.length<10) throw new Error('Phone number must include the country code');
        const response=await fetch(`https://graph.facebook.com/v22.0/${encodeURIComponent(process.env.WHATSAPP_PHONE_NUMBER_ID!)}/messages`,{
          method:'POST',headers:{'Authorization':`Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,'Content-Type':'application/json'},
          body:JSON.stringify({messaging_product:'whatsapp',to:digits,type:'template',template:{name:process.env.WHATSAPP_INVITE_TEMPLATE,language:{code:process.env.WHATSAPP_TEMPLATE_LANGUAGE||'en_US'},components:[{type:'body',parameters:[{type:'text',text:args.name},{type:'text',text:args.link}]}]}}),
          cache:'no-store',
        });
        if (!response.ok) throw new Error(errorMessage(response, await response.text()));
        result.whatsapp='sent';
      } catch(e) {result.whatsapp='failed';result.notes.push('WhatsApp: '+(e instanceof Error ? e.message : 'Unknown provider error'));}
    })());
  }
  await Promise.all(tasks);
  return result;
}
