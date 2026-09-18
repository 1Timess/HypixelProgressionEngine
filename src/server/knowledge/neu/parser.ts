import {
  NeuItemSourceSchema,
  type NeuItemSource,
} from "@/schemas/neu";

export class NeuItemParseError
  extends Error {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      "NeuItemParseError";
  }
}

export function parseNeuItem(
  value: unknown,
): NeuItemSource {
  const result =
    NeuItemSourceSchema.safeParse(
      value,
    );

  if (!result.success) {
    throw new NeuItemParseError(
      result.error.issues
        .map(
          (issue) =>
            `${
              issue.path.join(
                ".",
              ) || "<root>"
            }: ${issue.message}`,
        )
        .join("; "),
    );
  }

  return result.data;
}