import prisma from "../utility/database/index.js";

const CreateNewTicket = async (req, res) => {
  const { header, description, bookId } = req.body;
  const author = req.author;

  await prisma.ticket.create({
    data: {
      ...(bookId && { bookId }),
      authorId: author.id,
      detailDescription: description,
      createdDate: new Date(),
      updatedDate: new Date(),
    },
  });
};

export { CreateNewTicket };
