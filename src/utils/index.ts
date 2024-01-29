export function getApiKey() {
    const API_KEY = "a2c903cc-b31e-4547-9299-b6d07b7631ab"

    const a = 1111111111111

    function encryptTime(t: number) {
        var e = (1 * t + a).toString().split("")
            , n = parseInt((10 * Math.random()).toString(), 10).toString()
            , r = parseInt((10 * Math.random()).toString(), 10).toString()
            , o = parseInt((10 * Math.random()).toString(), 10).toString();
        return e.concat([n, r, o]).join("")
    }

    function encryptApiKey() {
        var t = API_KEY
            , e = t.split("")
            , n = e.splice(0, 8);
        return t = e.concat(n).join("")
    }

    function comb(t: string, e: string) {
        var n = "".concat(t, "|").concat(e);
        return btoa(n)
    }
    let t = (new Date).getTime()
        , e = encryptApiKey(), t1 = encryptTime(t);
    return comb(e, t1)
}