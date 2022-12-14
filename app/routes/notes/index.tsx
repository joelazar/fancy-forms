import type { Note } from "@prisma/client";
import { useActionData, useFetcher, useLoaderData } from "@remix-run/react";
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

  const intent = form.get("_intent");

  if (intent === "delete") {
    const id = form.get("id");
    if (typeof id !== "string" || !id) {
      return { error: "Missing id" };
    }
    // sleep 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      if (Math.random() > 0.5) {
        throw new Error("Random error");
      }

      return await prisma.note.delete({
        where: {
          id,
        },
      });
    } catch (e) {
      return { error: "Error deleting note", id };
    }
  }
  if (intent === "create") {
    const [title, body] = [form.get("title"), form.get("body")];
    if (typeof title !== "string" || !title) {
      return { error: "Title is required" };
    }
    if (typeof body !== "string" || !body) {
      return { error: "Body is required" };
    }
    return await prisma.note.create({ data: { title, body } });
  }

  return { error: "Unknown intent" };
};

export default function NotesRoute() {
  const { notes } = useLoaderData<LoaderData>();
  const actionData = useActionData<typeof action>();

  const fetcher = useFetcher();
  const deletedNoteId =
    fetcher.submission?.formData.get("_intent") === "delete"
      ? fetcher.submission?.formData.get("id")
      : null;

  const isCreating =
    fetcher.state === "submitting" &&
    fetcher.submission.formData.get("_intent") === "create";

  const failedDeleteNoteId = fetcher.data?.error ? fetcher.data?.id : null;

  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (window.confirm("Are you sure you want to delete this note?")) {
      fetcher.submit(event.currentTarget);
    }
  }

  useEffect(() => {
    if (!isCreating) {
      formRef.current?.reset();
      titleRef.current?.focus();
    }
  }, [isCreating]);

  return (
    <>
      <div className="flex max-w-3xl space-x-2 p-4">
        {notes.map((note) => {
          return note.id === deletedNoteId ? null : (
            <div
              key={note.id}
              className="flex max-w-sm flex-auto flex-col rounded border border-black bg-yellow-200 p-4 sm:p-6 lg:p-8"
            >
              <h2 className="text-2xl font-bold">{note.title}</h2>
              <ul className="text-lg">
                <li>Created at: {note.createdAt}</li>
                <li>Body: {note.body}</li>
              </ul>
              <fetcher.Form method="post" onSubmit={handleSubmit}>
                <input type="hidden" name="id" value={note.id} />
                <input type="hidden" name="_intent" value="delete" />
                <button
                  type="submit"
                  className="rounded bg-red-500 py-2 px-4 font-bold text-white hover:bg-red-700"
                >
                  {failedDeleteNoteId === note.id ? "Retry PLS" : "Delete"}
                </button>
              </fetcher.Form>
            </div>
          );
        })}
      </div>
      <div className="p-4">
        <fetcher.Form
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
            name="_intent"
            type="submit"
            value="create"
            className="border-2 border-green-700 bg-green-100 font-bold"
          >
            {isCreating ? "Creating" : "Create"}
          </button>
          {actionData?.error ? (
            <p className="font-bold text-red-500">{actionData.error}</p>
          ) : null}
        </fetcher.Form>
      </div>
    </>
  );
}
