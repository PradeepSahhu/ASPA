import app from "./app.js";
import "dotenv/config";
app.listen(process.env.PORT, () => {
  console.log(`Server started on PORT ${process.env.PORT}`);
});
