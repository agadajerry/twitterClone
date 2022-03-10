import app from './app';
import Message from './models/messageModel';

const Socketapi2 = () => {
  let users: Record<string, string | undefined> = {};

  const addUser = (userId: any, socketId: string) => {
    users[userId] = socketId;
  };

  const getUser = (userId: string) => {
    return users[userId];
  };

  const removeUser = (userId: string) => {
    users[userId] = undefined;
  };

  app.io.on('connection', (socket) => {
    console.log('connection');
    socket.on('addUser', (userId) => {
      addUser(userId, socket.id);
      app.io.emit('getUsers', users);
      console.log({ users });
      console.log('a user connected.');
      console.log(userId, socket.id);
    });

    socket.on('sendMessage', async ({ senderId, receiverId, conversationId, text }) => {
      const user = getUser(receiverId);
      console.log({ user });
      console.log({ senderId, receiverId, conversationId, text });

      const message = await Message.create({ senderId, conversationId, text });
      // message.save()

      console.log({ message });

      if (user)
        app.io.to(user).emit('getMessage', {
          message,
        });
      console.log({ users });
      console.log(senderId, text);
    });

    // conversationId, senderId, text, receiverId

    socket.on('disconnect', () => {
      //   console.log('a user disconnected!');
      //   removeUser(user);
      //   app.io.emit('getUsers', users);
    });
  });
};

export default Socketapi2;
