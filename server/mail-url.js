smtp = {
  username: 'contact@onvataider.com',
  password: 'Inoubliablepw21!!',
  server: 'ssl0.ovh.net',
  port: 587,
};
process.env.MAIL_URL = `smtp://${encodeURIComponent(smtp.username)}:${encodeURIComponent(smtp.password)}@${encodeURIComponent(smtp.server)}:${smtp.port}`;

// ==Emails==
Accounts.emailTemplates.siteName = 'Onvataider';
Accounts.emailTemplates.from = 'Onvataider <contact@onvataider.com>';

// Verify Email
Accounts.emailTemplates.verifyEmail = {
  subject() {
    return '[Onvataider] Vérifiez votre adresse e-mail';
  },
  text(user, url) {
    let emailAddress = user.emails[0].address,
      urlWithoutHash = url.replace('#/', ''),
      emailBody = `Nous vous remercions pour votre inscription sur Onvataider.
Pour vérifier votre adresse e-mail (${emailAddress}) visitez le lien suivant : \n\n${urlWithoutHash}

L'étape de validation de votre adresse email est nécessaire pour que vous puissiez accéder à la totalité des fonctionnalités disponibles sur Onvataider.
Si vous n'avez pas demandé cette vérification, ignorez ce courrier électronique. Si vous sentez que quelque chose ne va pas, contactez notre équipe de support.`;

    return emailBody;
  },
};

// Password Lost
Accounts.emailTemplates.resetPassword = {
  subject() {
    return '[Onvataider] Mot de passe oublié';
  },
  text(user, url) {
    let urlWithoutHash = url.replace('#/', ''),
      emailBody = `Une demande de réinitialisation de mot de passe a été demandée.
  Pour modifier votre mot de passe visitez le lien suivant : \n\n${urlWithoutHash}
  
  Si vous sentez que quelque chose ne va pas, contactez notre équipe de support.`;

    return emailBody;
  },
};
