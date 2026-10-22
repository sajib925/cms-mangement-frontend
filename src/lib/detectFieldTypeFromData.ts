
export const detectFieldTypeFromData = (
  values: string[]
):
  | "PlainText"
  | "Number"
  | "DateTime"
  | "Color"
  | "Link"
  | "Email"
  | "Phone" => {
  const nonEmptyValues = values.filter((v) => v && v.trim() !== "")

  if (nonEmptyValues.every((val) => /^\d+(\.\d+)?$/.test(val))) return "Number"
  if (nonEmptyValues.every((val) => /^\d{4}-\d{2}-\d{2}T/.test(val))) return "DateTime"
  if (nonEmptyValues.every((val) => /^#[0-9A-Fa-f]{6}$/.test(val))) return "Color"
  if (nonEmptyValues.every((val) => /^https?:\/\//.test(val))) return "Link"
  if (nonEmptyValues.every((val) => /.+@.+\..+/.test(val))) return "Email"
  if (nonEmptyValues.every((val) => /\(\d{3}\) \d{3}-\d{4}/.test(val))) return "Phone"
  return "PlainText"
}
