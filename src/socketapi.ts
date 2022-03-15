import app from './app';

const Socketapi = () => {
  let users: any[] = [];

  const addUser = (userId: any, socketId: string) => {
    !users.some((user) => user.userId === userId) && users.push({ userId, socketId });
  };

  const removeUser = (socketId: string) => {
    users = users.filter((user) => user.socketId !== socketId);
  };

  const getUser = (userId: any) => {
    return users.find((user) => user.userId === userId);
  };

  app.io.on('connection', (socket) => {
    //when ceonnect
    console.log('connection');
    //take userId and socketId from user
    socket.on('addUser', (userId) => {
      addUser(userId, socket.id);
      app.io.emit('getUsers', users);
      console.log({ users });
      console.log('a user connected.');
      console.log(userId, socket.id);
    });

    //send and get messages
    socket.on('sendMessage', ({ senderId, receiverId, text }) => {
      const user = getUser(receiverId);
      console.log({ user });
      console.log({ senderId, receiverId, text });
      app.io.to(user.socketId!).emit('getMessage', {
        senderId,
        text,
      });
      console.log({ users });
      console.log(senderId, text);
    });

    //when disconnect
    socket.on('disconnect', () => {
      console.log('a user disconnected!');
      removeUser(socket.id);
      app.io.emit('getUsers', users);
    });
  });
};

export default Socketapi;
