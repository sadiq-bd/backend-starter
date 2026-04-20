export function formatCount(num: number) {
    if (num < 1000) return num.toString();

    const units = ["K", "M", "B", "T"];
    let unitIndex = -1;

    while (num >= 1000 && unitIndex < units.length - 1) {
        num /= 1000;
        unitIndex++;
    }

    return num % 1 === 0
        ? num + units[unitIndex]
        : num.toFixed(1) + units[unitIndex];
}
