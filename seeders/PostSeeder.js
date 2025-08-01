import Post from "../models/Post.js";

async function PostSeeder() {
  try {
    await Post.insertOne({ name: "Agent d'entretien & Nettoyage" });
    console.log("Post insérées");
  } catch (error) {
    throw error;
  }
}
export default PostSeeder;
