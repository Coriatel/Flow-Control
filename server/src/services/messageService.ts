import prisma from '../utils/prisma';

export const messageService = {
  async sendMessage(data: {
    senderId: string;
    senderName: string;
    recipientType: string;
    recipientIds: string[];
    title: string;
    content: string;
    messageType?: string;
    priority?: string;
  }) {
    const message = await prisma.message.create({
      data: {
        senderId: data.senderId,
        senderName: data.senderName,
        recipientType: data.recipientType,
        recipientIds: JSON.stringify(data.recipientIds || []),
        title: data.title,
        content: data.content,
        messageType: data.messageType || 'MESSAGE',
        priority: data.priority || 'NORMAL',
      },
    });

    // Determine recipient users
    let userIds: string[] = [];
    if (data.recipientType === 'ALL') {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else {
      userIds = data.recipientIds || [];
    }

    // Create recipient records
    if (userIds.length > 0) {
      await prisma.messageRecipient.createMany({
        data: userIds.map((userId) => ({
          messageId: message.id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    return message;
  },

  async getMessagesForUser(
    userId: string,
    opts: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ) {
    const page = opts.page || 1;
    const limit = opts.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      isDismissed: false,
    };
    if (opts.unreadOnly) {
      where.isRead = false;
    }

    const [recipients, total] = await Promise.all([
      prisma.messageRecipient.findMany({
        where,
        include: {
          message: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.messageRecipient.count({ where }),
    ]);

    return {
      messages: recipients.map((r) => ({
        id: r.message.id,
        recipientId: r.id,
        senderId: r.message.senderId,
        senderName: r.message.senderName,
        title: r.message.title,
        content: r.message.content,
        messageType: r.message.messageType,
        priority: r.message.priority,
        isRead: r.isRead,
        readAt: r.readAt,
        createdAt: r.message.createdAt,
      })),
      total,
      page,
      limit,
    };
  },

  async getUnreadCount(userId: string) {
    return prisma.messageRecipient.count({
      where: {
        userId,
        isRead: false,
        isDismissed: false,
      },
    });
  },

  async markAsRead(messageId: string, userId: string) {
    return prisma.messageRecipient.updateMany({
      where: { messageId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async dismiss(messageId: string, userId: string) {
    return prisma.messageRecipient.updateMany({
      where: { messageId, userId },
      data: { isDismissed: true, dismissedAt: new Date() },
    });
  },
};
