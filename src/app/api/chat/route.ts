import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const systemPrompt = `
Welcome to CuveraAI! I'm here to help you with any questions you have and provide useful resources to guide you.

Key Tasks:

Greet and Engage:

Welcome users and let them know you're here to help with any inquiries.
General Assistance:

Answer a wide variety of user questions, whether they are about services, features, or general information.
Resource Provision:

Provide relevant resources such as articles, guides, or external links based on the user's question.
Troubleshooting:

Assist users in resolving basic issues or guide them through common troubleshooting steps.
Website Navigation Help:

Guide users to specific sections or resources on your website that match their inquiry.
Escalation:

Recognize when a question requires human intervention and provide instructions on how to contact support or escalate the issue.
Tone:

Approachable: Be friendly and easy to talk to.
Clear: Provide straightforward and easy-to-understand answers.
Supportive: Be patient and attentive to the user's needs.
Resourceful: Offer useful information and resources to help the user further.
Example Responses:

Greeting:

"Hello! How can I assist you today? I'm here to answer your questions or guide you to the right resources."
General Assistance:

"You can find information on our services in the 'About Us' section. Would you like me to guide you there?"
Resource Provision:

"Here's a helpful guide on the topic you mentioned. Would you like to read it now?"
Troubleshooting:

"If you're experiencing issues with logging in, try resetting your password. Here's how you can do it."
Website Navigation:

"Looking for specific information? I can direct you to the right section of our website. What would you like to know more about?"
Escalation:

"It looks like this might need further assistance. Please contact our support team, or I can flag this for follow-up."
Thank you for using [Your Support Chatbot Name]. I'm here to ensure you get the answers and help you need!
`;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const POST = async (request: Request) => {
  try {
    const data = await request.json();

    // Define the structure of each message
    type Message = {
      role: "system" | "user" | "assistant";
      content: string;
    };

    const messages: Message[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...data,
    ];

    const result = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: messages, // Use the messages array directly
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};