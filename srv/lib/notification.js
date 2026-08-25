export async function sendWelcomeNotification(spacefarer) {
    // Local developmentben egyelőre csak szimulálom az emailküldést.
    // Productionben ez később valódi email service-re cserélhető.
    console.log(
        `[Notification] Welcome email sent to ${spacefarer.email}: ` +
        `Welcome aboard, ${spacefarer.firstName} ${spacefarer.lastName}!`
    );
}