import { createFetchor } from "fetchor";

const api = createFetchor({
  baseURL: "https://jsonplaceholder.typicode.com",
});

const users = api.group("/users");

const getAllUsers = users.get("/");
const createUser = users.post("/");
const getUser = users.get("/:id");

const run = async () => {
  const allUsers = await getAllUsers();
  console.log("All Users:", allUsers);

  const newUser = await createUser({
    body: { name: "New User", username: "newuser", email: "user@example.com" },
  });
  console.log("New User:", newUser);

  const user = await getUser({ params: { id: 2 } });
  console.log("User 2:", user);
};

run();
