const { createApp } = require("./server");

const PORT = process.env.PORT || 4000;

const { httpServer } = createApp();

httpServer.listen(PORT, () => {
  console.log(`ManuFlow notifications service listening on port ${PORT}`);
});
