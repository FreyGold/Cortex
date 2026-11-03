import { aiRouter } from "./src/routes/ai";
import { AIController } from "./src/controllers/AIController";
console.log("AIController.getGlobalConversation is:", typeof AIController.getGlobalConversation);
console.log("Routes bound in aiRouter:");
(aiRouter as any).stack.forEach((r: any) => {
  if (r.route && r.route.path) {
    console.log(Object.keys(r.route.methods)[0].toUpperCase(), r.route.path);
  }
});
