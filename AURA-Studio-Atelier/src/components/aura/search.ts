// Accept natural Turkish typing, including keyboards without Turkish letters.
export function searchText(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .trim();
}
