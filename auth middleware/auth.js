import jwt from "jsonwebtoken";

export const auth = (request, response, next) => {
  try {
    const token = request.header("x-auth-token");
    jwt.verify(token, process.env.SECRET_KEY);
    next();
  } catch {
    response.status(401).send({ message: "no allowed" });
  }
};
