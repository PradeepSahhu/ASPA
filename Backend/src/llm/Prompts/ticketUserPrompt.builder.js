const formatTicketContext = ({
  id,
  header,
  detailDescription,
}) => `TICKET TO PROCESS:
Ticket ID: "${id}"
Header: "${header}"
Description: "${detailDescription}"`;

export const buildCategorizeTicketPrompt = (
  ticket,
) => `${formatTicketContext(ticket)}

Please classify the ticket category and decide the priority score based on impact and urgency. Then update both values in DB using the available tools.`;

export const buildDraftResponsePrompt = (
  ticket,
) => `The author has submitted the following support ticket:

${formatTicketContext(ticket)}

Please generate a professional and helpful draft response for this ticket.`;
