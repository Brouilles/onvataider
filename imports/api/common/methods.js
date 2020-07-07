import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';

Meteor.methods({
  sendContactEmail({ name, email, msg }) {
    const text = `Nom: ${name}\n`
            + `Email: ${email}\n\n\n${
              msg}`;

    Email.send({
      to: 'contact@onvataider.com',
      from: email,
      subject: `Formulaire Onvataider - Message de ${name}`,
      text,
    });

    return true;
  },
});
