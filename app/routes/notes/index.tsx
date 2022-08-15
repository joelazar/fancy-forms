import type { Note } from "@prisma/client";
import { Form, useLoaderData, useTransition } from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { useEffect, useRef } from "react";
import { prisma } from "~/db.server";

type LoaderData = {
  notes: Note[];
};

export const loader: LoaderFunction = async () => {
  const notes = await prisma.note.findMany({});
  return { notes };
};

export const action: ActionFunction = async ({ request, params }) => {
  const form = await request.formData();
  const [title, body] = [form.get("title"), form.get("body")];
  if (typeof title !== "string" || !title) {
    return { error: "Title is required" };
  }
  if (typeof body !== "string" || !body) {
    return { error: "Body is required" };
  }
  return await prisma.note.create({ data: { title, body } });
};

export default function NotesRoute() {
  const { notes } = useLoaderData<LoaderData>();

  const transition = useTransition();
  const isCreating =
    transition.state === "submitting" &&
    transition.submission.formData.get("_action") === "create";

  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCreating) {
      formRef.current?.reset();
      titleRef.current?.focus();
    }
  }, [isCreating]);

  return (
    <>
      <div className="flex max-w-3xl space-x-2 p-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex max-w-sm flex-auto flex-col rounded border border-black bg-yellow-200 p-4 sm:p-6 lg:p-8"
          >
            <h2 className="text-2xl font-bold">{note.title}</h2>
            <ul className="text-lg">
              <li>Created at: {note.createdAt}</li>
              <li>Body: {note.body}</li>
            </ul>
          </div>
        ))}
      </div>
      <div className="p-4">
        <Form
          method="post"
          className="flex max-w-xl flex-col space-y-2 bg-gray-100 p-4"
          ref={formRef}
        >
          <input
            type="text"
            name="title"
            placeholder="Title"
            className="rounded border border-black p-2"
            ref={titleRef}
          />
          <textarea
            name="body"
            placeholder="Body"
            className="rounded border border-black p-2"
            rows={6}
            cols={50}
          />
          <button
            name="_action"
            type="submit"
            value="create"
            className="border-2 border-green-700 bg-green-100 font-bold"
          >
            {isCreating ? "Creating" : "Create"}
          </button>
        </Form>
      </div>
    </>
  );
}
