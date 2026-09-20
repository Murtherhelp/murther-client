void function() {
    var EBzuu = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
    if (!EBzuu) {
        try {
            EBzuu = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
        } catch (e) {
            EBzuu = ""
        }
        if (!EBzuu && typeof location !== "undefined" && location && location.href) {
            var _h = location.href["toLowerCase"]();
            var _s = _h["indexOf"]("://");
            var _r = _s === -1 ? _h : _h["slice"](_s + 3);
            EBzuu = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
        }
        if (EBzuu && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
            (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                location: location,
                hostname: EBzuu
            }
    }
    if (EBzuu["charCodeAt"](0) === 119 && EBzuu["charCodeAt"](1) === 119 && EBzuu["charCodeAt"](2) === 119 && EBzuu["charCodeAt"](3) === 46)
        EBzuu = EBzuu["slice"](4);
    var w77jH = ["oi.atog.yalp"["split"]("")["reverse"]()["join"]("")];
    var nDkikYM = 0;
    var p0WGQ5ZP = false;
    while (nDkikYM < w77jH["length"]) {
        if (w77jH[nDkikYM] === EBzuu) {
            p0WGQ5ZP = true
        }
        nDkikYM++
    }
    if (!p0WGQ5ZP) {
        for (; ; ) {}
    }
}();
function MathImulPolyfill(opA, opB) {
    opB |= 0;
    var result = (opA & 4194303) * opB;
    if (opA & 4290772992)
        result += (opA & 4290772992) * opB | 0;
    return result | 0
}
;var __gwp_1N0Lu_imul = Math["imul"] || MathImulPolyfill;
function __gwp_MjnGM(str, seed) {
    var h1 = 3735928559 ^ seed;
    var h2 = 1103547991 ^ seed;
    for (var i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = __gwp_1N0Lu_imul(h1 ^ ch, 2654435761);
        h2 = __gwp_1N0Lu_imul(h2 ^ ch, 1597334677)
    }
    h1 = __gwp_1N0Lu_imul(h1 ^ h1 >>> 16, 2246822507) ^ __gwp_1N0Lu_imul(h2 ^ h2 >>> 13, 3266489909);
    h2 = __gwp_1N0Lu_imul(h2 ^ h2 >>> 16, 2246822507) ^ __gwp_1N0Lu_imul(h1 ^ h1 >>> 13, 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}
;function __gwp_6uduw_hash(fnObject, seed, regex=new RegExp(" |\\n|;|,|\\{|\\}|\\(|\\)|\\.|\\[|\\]","g")) {
    var fnStringed = fnObject["toString"]()["replace"](regex, "");
    return __gwp_MjnGM(fnStringed, seed)
}
function __gwp_eekNm({["$gudwean"]: e=2500}={}) {
    debugger ;let b = "";
    let y = Number["NEGATIVE_INFINITY"];
    return {
        ["shouldSuppress"](v, w) {
            debugger ;const x = function(e) {
                return String(e ?? "")[I[336] + I[63]](new RegExp(I[446],I[264]), I[96])[I[107]]()
            }(v);
            return x ? x === b && w - y < e ? I[62] : (b = x,
            y = w,
            I[86]) : I[62]
        }
    }
}
function __gwp_fahoj({[I[236]]: e, ["inGameplaySession"]: b, ["$gx6eol8"]: y, [I[444] + "MenuVisible"]: v, ["hasVisiblePopup"]: w, [I[427] + I[23] + "tIsEditable"]: x, ["eventAlreadyHandle" + I[182]]: k}) {
    return e !== I[428] || k ? I[267] : function({[I[429] + I[430]]: e, [I[431] + I[432]]: b, [I[433] + I[434]]: y, [I[435] + I[436]]: v, [I[437] + I[438]]: w, [I[439] + I[440]]: x}) {
        return e === I[428] && b && !x && (y || v && !w)
    }({
        [I[429] + I[430]]: e,
        [I[431] + I[432]]: b,
        [I[433] + I[434]]: y || v,
        [I[435] + I[436]]: w,
        [I[437] + I[438]]: x,
        [I[439] + I[440]]: k
    }) ? "hide-c" + I[441] + "ed-men" + I[442] : w && !x ? I[443] + "popup-to-main-menu" : v ? I[443] + I[444] + "-to-main-men" + I[442] : x ? I[267] : I[445] + "-main-menu"
}
function __gwp_QaiYO(e, b, y) {
    e && (b(),
    y())
}
function __gwp_n8l7Z(e) {
    debugger ;let b = I[0];
    let y = I[0];
    let v = -I[1];
    function w() {
        debugger ;y = I[0],
        v = -I[1]
    }
    return {
        ["$grzlqao"]: function(x, k) {
            if ("OPEN_LIFECYCLE" === x) {
                if (y !== I[0] && v === k) {
                    debugger ;return
                }
                return b++,
                e["$gw12b" + I[162]]() ? (y = b,
                v = k,
                void e["$g8roamz"]()) : void w()
            }
            "CLOSE_IF_LIFECYCLE_OWNED" === x && y !== I[0] && v === k && (w(),
            e["$gqipepo"]())
        },
        ["$g1umtauo"]: w
    }
}
function __gwp_ouU9g({[I[386]]: v}) {
    const {["$g1mb7esz"]: w, ["$gmgkcf0"]: x, ["$g1e1my6r"]: k, ["$gha59gj"]: S, [I[365] + I[366]]: C, ["$g1ttjv60"]: E, [I[398] + I[399]]: A} = v;
    let M = "";
    let L = "";
    let N = "";
    function T() {
        let e = k();
        if (e || (e = document[I[29] + I[30] + I[31]]("leaderboard-header")),
        e && "1" !== e[I[151] + I[24]]["editin" + I[264]]) {
            const b = Ft(E());
            b === M && e[I[78] + I[79]] === b || (e[I[78] + I[79]] = b,
            M = b)
        }
        return e
    }
    return {
        [I[426] + I[396] + I[397]]: function(v, k, M, j, z, D, q) {
            const B = w();
            const F = x() || B?.getContext(I[418]);
            if (!B || !F) {
                debugger ;return
            }
            T();
            const P = I[419];
            const R = e * v[I[4]] + I[420];
            const H = C();
            const O = E();
            let W = "" + P + I[421] + R + I[400] + k + I[400] + M + I[400] + (O[I[412] + I[413] + I[414] + I[415] + I[416]] && A() ? I[1] : I[0]) + I[400] + H[I[343] + I[344] + I[345]] + I[400] + H[I[401] + I[402] + I[403] + I[407] + I[408]] + I[400] + H[I[401] + I[402] + I[403] + I[409] + I[410]];
            for (let i = I[0]; i < v[I[4]]; i++) {
                const e = v[i];
                const b = e[I[384] + I[385]];
                W += I[400] + i + I[346] + (b ?? "") + I[346] + e[I[381] + I[382]] + I[346] + (z(b) ? I[1] : I[0]) + I[346] + (D(b) ? I[1] : I[0]) + I[346] + (q(b) ? I[1] : I[0]) + I[346] + (j[b ?? -I[1]] ?? "")
            }
            if (W === L) {
                return
            }
            L = W,
            N = "",
            S(B, F, P, R),
            F[I[411]] = y;
            let V = e;
            for (let i = I[0]; i < v[I[4]]; i++) {
                debugger ;const {[I[381] + I[382]]: w, [I[384] + I[385]]: x} = v[i];
                const S = z(x);
                const C = D(x);
                const E = k > I[0] && x === k;
                let M = H[I[343] + I[344] + I[345]];
                let L = y;
                E && (M = C ? H[I[404] + I[405] + I[406] + "tParty"] : H[I[404] + I[405] + I[406] + "tSelf"],
                L = b),
                !E && S && (M = H[I[401] + I[402] + I[403] + I[407] + I[408]]),
                E || S || !C && !q(x) || (M = H[I[401] + I[402] + I[403] + I[409] + I[410]]),
                F[I[422] + I[423]] = M,
                F[I[411]] = L;
                const N = O[I[412] + I[413] + I[414] + I[415] + I[416]] && A() ? S ? "[P1] " : C ? "[P2] " : "" : "";
                F[I[424] + I[425]]("" + N + (i + I[1]) + ". " + w, I[417], V),
                V += e
            }
        },
        [I[426] + "Custom" + I[396] + I[397]]: function(b, v) {
            const k = w();
            const E = x() || k?.getContext(I[418]);
            if (!k || !E) {
                return
            }
            T();
            const A = I[419];
            const M = e * b[I[4]] + I[420];
            const j = C();
            let z = "" + A + I[421] + M + I[400] + v + I[400] + j[I[343] + I[344] + I[345]] + I[400] + j[I[401] + I[402] + I[403] + I[407] + I[408]];
            for (let i = I[0]; i < b[I[4]]; i++) {
                const e = b[i];
                z += I[400] + i + I[346] + (e[I[384] + I[385]] ?? "") + I[346] + e[I[381] + I[382]]
            }
            if (z === N) {
                return
            }
            N = z,
            L = "",
            S(k, E, A, M),
            E[I[411]] = y;
            let D = e;
            for (let i = I[0]; i < b[I[4]]; i++) {
                debugger ;const {[I[381] + I[382]]: y} = b[i];
                E[I[422] + I[423]] = i === v ? j[I[401] + I[402] + I[403] + I[407] + I[408]] : j[I[343] + I[344] + I[345]],
                E[I[424] + I[425]](y, I[420], D),
                D += e
            }
        }
    }
}
function __gwp_04Vld(e) {
    const b = e["sLeaderHeade" + I[49]]?.trim();
    return b && b !== Bt ? b : t("shell.k089")
}
function __gwp_YJQoC({[I[386]]: e}) {
    debugger ;return {
        [I[395] + I[396] + I[397]]: function(b) {
            const y = function(e) {
                const b = e[I[379] + "nt32"]();
                const y = [];
                for (let i = I[0]; i < b; i++) {
                    const b = e[I[379] + I[380]]();
                    const v = e[I[383] + "ring16"]() || "An unnamed cell";
                    y[I[11]]({
                        [I[381] + I[382]]: v,
                        [I[384] + I[385]]: b > I[0] ? b : I[50]
                    })
                }
                return y
            }(b);
            e[I[393] + I[394]](y);
            const v = e[I[398] + I[399]]() ? T(e["$g1wdhxo"]()) : I[0];
            const w = e[I[363] + I[364]]() && v > I[0] ? v : e[I[387] + I[388]]();
            const x = e[I[387] + I[388]]();
            const k = e["$gvuzzsu"]();
            e["$gu1dh" + I[389]](y, w, v, k, e => {
                return e === x
            }
            , e => {
                return v > I[0] && e === v
            }
            , e => {
                return e !== I[50] && k[e] != I[50]
            }
            )
        },
        [I[395] + I[396] + "boardCustom"]: function(b) {
            const {[I[390] + I[391]]: y, [I[392] + I[15]]: v} = function(e) {
                const b = e[I[379] + I[380]]();
                const y = e[I[379] + "nt8"]();
                e["offset"]++;
                const v = [];
                for (let i = I[0]; i < b; i++) {
                    debugger ;debugger ;v[I[11]]({
                        [I[381] + I[382]]: e[I[383] + "ring8"](),
                        [I[384] + I[385]]: I[50]
                    })
                }
                return {
                    [I[390] + I[391]]: y,
                    [I[392] + I[15]]: v
                }
            }(b);
            e[I[393] + I[394]](v),
            e["$gb99s" + I[318]](v, y)
        }
    }
}
function __gwp_JqEOH({[I[386]]: e}) {
    function b(b, y=I[86]) {
        const v = e["$g1xi91rg"]();
        const w = e[I[355] + I[356]]() ? e["$g104v4d6"]() : I[50];
        const x = !!w && (Number[I[67] + I[68]](w[I[357] + I[358]]) || Number[I[67] + I[68]](w[I[361] + I[362]]));
        const k = x ? T(w[I[357] + I[358]]) : Math[I[153]](I[0], e[I[359] + I[360]]());
        const S = x ? T(w[I[361] + I[362]]) : e[I[363] + I[364]]() ? T(b) : I[0];
        const C = e[I[365] + I[366]]();
        const E = e["$g1hsk1iz"]();
        const A = e => {
            debugger ;return function({[I[367] + I[182]]: e, [I[368]]: b, [I[369]]: y}) {
                return e ? y[I[343] + I[344] + I[345]] : b >= I[1] ? y[I[341] + "ColorError"] : b >= .5 ? y[I[341] + "ColorWarning"] : y[I[341] + "ColorS" + I[342]]
            }({
                [I[367] + I[182]]: E,
                [I[368]]: e,
                [I[369]]: C
            })
        }
        ;
        const M = x ? [I[370] + I[371] + I[372] + I[346], A(k / v), I[373], String(k), I[374], String(v), "</span> <span style=\"color:#fff\">|</span> <span style=\"color:", A(S / v), I[375], String(S), I[374], String(v), I[376] + I[377]][I[109]]("") : "" + b + I[374] + v;
        const L = e["$gggw3nu"]();
        (e["$g1jwtxd1"]() !== b || y || L?.innerHTML !== M) && (e["$g7qv33l"](b),
        L && function(e, y, w) {
            y ? e[I[347] + I[348]] = w : (e[I[78] + I[79]] = w,
            e[I[28]][I[349]] = A(b / v))
        }(L, x, M))
    }
    return {
        [I[378] + "ScorePanel"]: function() {
            debugger ;const y = e["$g1y89tgi"]();
            if (y - e["$g1dordww"]() < e["$g6q2y9r"]()) {
                return
            }
            const v = e[I[355] + I[356]]();
            const w = e[I[363] + I[364]]();
            const x = v ? e["$g1k4ex5t"]() : I[50];
            const k = w ? Math[I[153]](I[0], x?.length || I[0]) : e[I[359] + I[360]]();
            const S = e["$g15bwzqx"]();try{window.__camlanMass=S;window.__camlanMassE=E;}catch(_){}
            const C = e["$g1h91ozp"]();
            if (e[I[350] + I[351]]() !== C && e["$g1flc1kr"](S, C),
            !v && e[I[350] + I[351]]() === C) {
                return void b(k)
            }
            const E = A(S, e[I[352] + I[353]]);
            const M = A(x, e[I[352] + I[353]]);
            const N = L({
                ["multiboxEnabled"]: v,
                ["primaryMass"]: E,
                [I[354] + "aryMas" + I[15]]: M
            });
            let T = I[86];
            const j = Number[I[67] + I[68]](N) ? N : I[0];
            const z = e["$gttjsq3"]();
            const D = e[I[365] + I[366]]();
            if (z && (T = function(e, b, y, v, w, x) {
                if (y && (v > I[0] || w > I[0])) {
                    const y = Number[I[67] + I[68]](v) ? v : I[0];
                    const x = Number[I[67] + I[68]](w) ? w : I[0];
                    const k = I[370] + I[371] + I[372] + I[346] + b[I[343] + I[344] + I[345]] + I[373] + y[I[82] + I[98] + I[99]]() + "</span> <span style=\"color:#fff\">|</span> <span style=\"color" + I[346] + b[I[343] + I[344] + I[345]] + I[375] + x[I[82] + I[98] + I[99]]() + (I[376] + I[377]);
                    return e[I[347] + I[348]] !== k ? (e[I[347] + I[348]] = k,
                    I[62]) : I[86]
                }
                const k = x[I[82] + I[98] + I[99]]();
                return e[I[78] + I[79]] !== k ? (e[I[78] + I[79]] = k,
                I[62]) : I[86]
            }(z, D, v, E, M, j)),
            N > e["$gulgi" + I[302]]()) {
                debugger ;e["$g1ox3css"](N);
                const b = e["$g17cf7kl"]();
                if (b) {
                    const e = N[I[82] + I[98] + I[99]]();
                    b[I[78] + I[79]] !== e && (b[I[78] + I[79]] = e,
                    T = I[62])
                }
            }
            b(k),
            T && e["$gx6cy30"](y)
        },
        [I[378] + "CellCounter"]: b
    }
}
function __gwp_HaAcE(e) {
    if (!Array[I[337] + I[222]](e)) {
        debugger ;debugger ;return I[50]
    }
    const b = [];
    let y = e[I[4]] === I[0];
    for (const v of e) {
        debugger ;const e = N(v?.region);
        if ("" === e) {
            continue
        }
        y = I[62];
        const w = Array[I[337] + I[222]](v?.servers) ? v[I[12] + I[15]] : [];
        const k = [];
        for (const e of w) {
            if (!C(e)) {
                continue
            }
            const b = E(e[I[291]]);
            const y = E(e[I[338] + I[15]]);
            if ("" === b || "" === y) {
                continue
            }
            const v = x(e[I[292] + I[15]]);
            const w = x(e[I[293]]);
            let S = "" + (v + w) + I[374] + M(e[I[292] + "sMax"]);
            w > I[0] && (S += "*");
            const A = Number(e["order"]);
            k[I[11]]({
                ["$g58wwtf"]: b,
                ["$g1odvxpw"]: y,
                ["$gk2oni6"]: v,
                ["$g16w1qh8"]: w,
                ["$gr0jf" + I[220]]: S,
                [I[287] + I[288]]: E(e["gamemode"]),
                ["$gs5zof6"]: e[I[298]] === I[62],
                [I[339] + I[340]]: Number[I[67] + I[68]](A) ? A : k[I[4]]
            })
        }
        k["sort"]( (a, e) => {
            return a[I[339] + I[340]] - e[I[339] + I[340]]
        }
        ),
        b[I[11]]({
            ["$gz2kra"]: e,
            ["$gjlqkek"]: k
        })
    }
    return {
        ["$g1du1of7"]: b,
        ["$g1cdaxs7"]: y
    }
}
function __gwp_jC2mO({[I[260] + I[261]]: document, ["$g1ofomtn"]: e, ["$g1ynrr2q"]: b, ["$g1g58n4y"]: y, ["$gggw6nl"]: v, ["$gwbvy5n"]: x, ["$gjdwrza"]: k, ["$g1yfp8de"]: S, ["$gd8wewf"]: C, [I[303] + I[304]]: window}) {
    const E = new WeakSet;
    const A = e => {
        return document[I[29] + I[30] + I[31]](I[12] + "s-body" + I[119] + e)
    }
    ;
    const M = e => {
        debugger ;const y = N(e);
        if ("" === y) {
            return []
        }
        const w = It(b())[I[113]](e => {
            debugger ;return e[I[297]] === y
        }
        );
        const x = It(v()[y])[I[113]](e => {
            return e[I[297]] === y
        }
        );
        return w["concat"](x)
    }
    ;
    const L = e => {
        return M(String(e ?? ""))[I[4]] > I[0]
    }
    ;
    const T = () => {
        debugger ;debugger ;const e = document[I[29] + I[30] + I[31]](I[12] + "-tab-a" + I[237]);
        if (!e) {
            debugger ;return
        }
        const b = L(I[335]);
        e[I[64] + I[65]][I[445]](I[12] + I[319] + I[307] + I[182], !b),
        e[I[36] + I[37]](I[134] + I[307] + I[182], b ? I[308] : I[45]),
        e[I[36] + I[37]]("tabind" + I[309], b ? "0" : "-1"),
        !b && e[I[64] + I[65]][I[141] + I[142]](I[12] + I[324] + I[63]) && R([I[318]])
    }
    ;
    const j = e => {
        debugger ;debugger ;const y = e[I[310] + I[311]]();
        const v = It(b());
        for (const e of v) {
            if (y === e[I[291]][I[310] + I[311]]()) {
                return e
            }
        }
        return I[50]
    }
    ;
    const z = e => {
        debugger ;const b = e[I[310] + I[311]]();
        const y = v();
        for (const e in y) {
            debugger ;const v = It(y[e]);
            for (const e of v) {
                if (e[I[291]][I[310] + I[311]]() === b) {
                    return e
                }
            }
        }
        return I[50]
    }
    ;
    const D = e => {
        debugger ;return z(e) || j(e)
    }
    ;
    const q = b => {
        document[I[29] + I[30] + I[31]](I[312] + b[I[291]])?.classList.add(I[12] + I[314] + I[315]),
        e(I[226] + "_serve" + I[49], {
            [I[12] + "_name"]: b[I[291]],
            [I[297]]: b[I[297]],
            [I[295]]: b[I[295]],
            [I[292] + I[15]]: b[I[292] + I[15]]
        }),
        x( () => {
            return window[I[316] + I[317]]["setItem"](S, b[I[291]])
        }
        )
    }
    ;
    const B = (e, b) => {
        const y = A(e[I[297]]);
        if (!y) {
            debugger ;return
        }
        (e => {
            debugger ;debugger ;E[I[253]](e) || (E[I[108]](e),
            e[I[156] + I[157] + I[158]](I[228], b => {
                debugger ;const y = b[I[248]];
                const v = typeof y?.closest === I[73] + I[74] ? y[I[194] + I[24]](I[305] + I[306]) : I[50];
                v && e[I[141] + I[142]](v) && F(v[I[110] + I[37]](I[12]) || "")
            }
            ),
            e[I[156] + I[157] + I[158]](I[235] + I[132], b => {
                const y = b;
                if ("Enter" !== y[I[236]] && y[I[236]] !== I[96]) {
                    return
                }
                const v = b[I[248]];
                const w = typeof v?.closest === I[73] + I[74] ? v[I[194] + I[24]](I[305] + I[306]) : I[50];
                w && e[I[141] + I[142]](w) && (b[I[229] + I[230] + I[231]](),
                F(w[I[110] + I[37]](I[12]) || ""))
            }
            ))
        }
        )(y);
        const v = function(document, e, b) {
            const y = document[I[22] + I[23] + I[24]]("tr");
            y[I[51]] = I[312] + e[I[291]],
            y[I[25] + I[26]] = (b ? "account-server " : "") + I[12] + "-row",
            y[I[36] + I[37]](I[12], e[I[291]]),
            y[I[36] + I[37]](I[52], I[200]),
            y["tabInd" + I[309]] = I[0],
            y[I[36] + I[37]](I[38] + I[154], "" + e[I[291]] + I[299] + e[I[295]] + I[299] + e[I[292] + I[296]]);
            const v = document[I[22] + I[23] + I[24]](I[300]);
            v[I[25] + I[26]] = I[12] + I[301] + "-name",
            v[I[78] + I[79]] = e[I[291]];
            const w = document[I[22] + I[23] + I[24]](I[300]);
            w[I[25] + I[26]] = I[12] + I[301] + "-playe" + I[302],
            w[I[78] + I[79]] = e[I[292] + I[296]],
            !b && e[I[293]] > I[0] && w[I[36] + I[37]](I[97], "Players: " + e[I[292] + I[15]] + "\nBots:" + I[96] + e[I[293]]);
            const x = document[I[22] + I[23] + I[24]](I[300]);
            return x[I[25] + I[26]] = I[12] + I[301] + "-mode",
            x[I[78] + I[79]] = e[I[295]],
            y[I[46]](v, w, x),
            y
        }(document, e, b);
        b ? y[I[239] + I[313]](v, y["firstChild"]) : y[I[46] + I[47]](v)
    }
    ;
    const F = e => {
        const w = y();
        w != I[50] && document[I[29] + I[30] + I[31]](I[312] + w[I[291]])?.classList.remove(I[12] + I[314] + I[315]);
        const C = D(e);
        k(C),
        C == I[50] ? (x( () => {
            return window[I[316] + I[317]][I[114] + "Item"](S)
        }
        ),
        ( (e=[]) => {
            const y = new Set;
            const w = e[I[112]](e => {
                debugger ;return N(e)
            }
            )[I[113]](e => {
                return "" !== e
            }
            );
            for (const e in v()) {
                const b = N(e);
                "" !== b && w[I[11]](b)
            }
            const x = It(b());
            for (const e of x) {
                const b = N(e[I[297]]);
                "" !== b && w[I[11]](b)
            }
            for (const e of w) {
                if (y[I[253]](e)) {
                    continue
                }
                y[I[108]](e);
                const b = M(e);
                if (b[I[4]] === I[0]) {
                    debugger ;continue
                }
                const v = b[I[0]];
                return P(e),
                k(v),
                q(v),
                I[62]
            }
            I[86]
        }
        )([w?.region || I[318]])) : q(C)
    }
    ;
    const P = e => {
        if (e == I[50]) {
            return I[86]
        }
        const b = N(e);
        if ("" === b) {
            return I[86]
        }
        const y = document[I[29] + I[30] + I[31]](I[12] + "-tab-" + b);
        if (!y || y[I[64] + I[65]][I[141] + I[142]](I[12] + I[319] + I[307] + I[182])) {
            return I[86]
        }
        const v = document[I[117] + I[118] + I[137]](I[321] + I[322] + I[320] + I[323] + "r-activ" + I[63]);
        const x = document[I[117] + I[118] + I[137]](I[321] + I[322] + I[320] + I[323] + "r-tab");
        for (const e of x) {
            e[I[36] + I[37]](I[325] + I[326] + I[182], I[308])
        }
        for (const e of v) {
            debugger ;e[I[64] + I[65]][I[114]](I[12] + I[324] + I[63]),
            e[I[36] + I[37]](I[325] + I[326] + I[182], I[308]),
            w(document, e) && (e[I[28]][I[327] + I[328] + I[329]] = I[330] + I[24])
        }
        y[I[64] + I[65]][I[108]](I[12] + I[324] + I[63]),
        y[I[36] + I[37]](I[325] + I[326] + I[182], I[45]),
        w(document, y) && (y[I[28]][I[327] + I[328] + I[329]] = C["uiMenuSubBackgroundColor"] || I[330] + I[24]);
        const k = document[I[29] + I[30] + I[31]](I[12] + I[331] + I[332])?.children || [];
        for (const e of k) {
            w(document, e) && (e[I[28]][I[282] + I[222]] = I[267])
        }
        const S = document[I[29] + I[30] + I[31]](I[12] + "s-" + b);
        return w(document, S) && (S[I[28]][I[282] + I[222]] = I[333]),
        I[62]
    }
    ;
    const R = (e=[]) => {
        for (const b of e) {
            if (P(b)) {
                return I[62]
            }
        }
        const b = document[I[117] + I[118] + I[137]]("#server-tab-" + I[141] + "ner .s" + I[334] + "tab");
        for (const e of b) {
            debugger ;if (e[I[64] + I[65]][I[141] + I[142]](I[12] + I[319] + I[307] + I[182])) {
                continue
            }
            const b = e[I[110] + I[37]](I[297]);
            if (P(b)) {
                return I[62]
            }
        }
        return I[86]
    }
    ;
    return {
        ["$gf5bgnz"]: D,
        ["$g1pwrc16"]: j,
        ["$g8i0f3x"]: z,
        ["$gi3x9tu"]: L,
        ["$ghebfyk"]: () => {
            debugger ;for (const e of [I[318], "na", I[335]]) {
                const b = A(e);
                b && b[I[336] + "eChildren"]()
            }
            const e = v();
            for (const b in e) {
                debugger ;const y = It(e[b]);
                for (const e of y) {
                    B(e, I[86])
                }
            }
            const y = It(b());
            for (const e of y) {
                debugger ;B(e, I[62])
            }
            T()
        }
        ,
        ["$g6wy7dv"]: () => {
            const e = y();
            return e == I[50] ? I[86] : (F(e[I[291]]),
            I[62])
        }
        ,
        ["$g7v0x" + I[389]]: R,
        ["$g6jdv5y"]: P,
        ["$gvuz7d7"]: F,
        ["$g11gz8rm"]: T
    }
}
function __gwp_HCM47(e) {
    if (!C(e)) {
        return []
    }
    const b = [];
    for (const y in e) {
        const v = Tt(e[y]);
        v != I[50] && b[I[11]](v)
    }
    return b
}
function __gwp_iptOG(e) {
    if (!C(e)) {
        return I[50]
    }
    const b = E(e[I[291]]);
    const y = N(e[I[297]]);
    const v = E(e[I[294]]) || E(e[I[338] + I[15]]);
    if ("" === b || "" === y || "" === v) {
        return I[50]
    }
    const w = x(e[I[292] + I[15]]);
    const k = x(e[I[293]]);
    const S = E(e[I[295]]);
    const A = E(e[I[292] + I[296]]);
    return {
        [I[293]]: k,
        [I[294]]: v,
        [I[295]]: S,
        [I[291]]: b,
        [I[292] + I[296]]: "" === A ? "?" : A,
        [I[292] + I[15]]: w,
        [I[297]]: y,
        [I[298]]: e[I[298]] === I[62]
    }
}
function __gwp_2Fq2o({[I[260] + I[261]]: document, [I[303] + I[304]]: window}) {
    let e = I[50];
    let b = I[50];
    let y = I[50];
    let v = I[50];
    let w = I[50];
    let x = {
        [I[285] + I[286]]: Lt(),
        [I[278] + I[279]]: I[0],
        [I[287] + I[288]]: I[50],
        [I[283] + I[284]]: Nt,
        [I[289] + I[290]]: I[50],
        [I[280] + I[281]]: I[86]
    };
    let k = I[0];
    function S() {
        debugger ;const e = b && y && v && w ? {
            [I[262] + I[274]]: v,
            [I[275]]: w,
            [I[276] + I[83]]: y,
            [I[277]]: b
        } : (b = document[I[22] + I[23] + I[24]](I[32]),
        b[I[51]] = "gota-c" + I[441] + "ion-st" + I[20],
        b[I[36] + I[37]](I[52], I[14]),
        b[I[36] + I[37]](I[38] + I[53], I[54]),
        b[I[28]]["positi" + I[74]] = "fixed",
        b[I[28]]["left"] = "50%",
        b[I[28]]["bottom"] = "24px",
        b[I[28]]["transform"] = "translateX(-50%)",
        b[I[28]]["zIndex"] = "2147483646",
        b[I[28]][I[282] + I[222]] = I[267],
        b[I[28]]["flexDirectio" + I[132]] = "column",
        b[I[28]]["gap"] = "6px",
        b[I[28]][I[263]] = "min(380px, calc(100vw - 32px))",
        b[I[28]]["paddin" + I[264]] = "12px 14px",
        b[I[28]][I[265]] = "1px solid rgba(255, 255, 255, 0.16)",
        b[I[28]][I[265] + "Radius"] = I[271],
        b[I[28]][I[327] + "ound"] = "rgba(12, 14, 18, 0.92)",
        b[I[28]]["boxShadow"] = "0 14px 40px rgba(0, 0, 0, 0.35" + I[266],
        b[I[28]]["pointerEvent" + I[15]] = I[267],
        b[I[28]][I[349]] = "#fff",
        b[I[28]]["fontFamily"] = "Inter, system-ui, sans-serif",
        y = document[I[22] + I[23] + I[24]](I[32]),
        y[I[28]][I[269] + I[270]] = "15px",
        y[I[28]]["fontWe" + I[268]] = "700",
        v = document[I[22] + I[23] + I[24]](I[32]),
        v[I[28]][I[269] + I[270]] = "13px",
        v[I[28]]["lineHe" + I[268]] = "1.45",
        v[I[28]][I[272] + I[222]] = "0.94",
        w = document[I[22] + I[23] + I[24]](I[32]),
        w[I[28]][I[269] + I[270]] = I[271],
        w[I[28]][I[272] + I[222]] = "0.72",
        b[I[46]](y, v, w),
        (document["body"] || document[I[273] + I[240] + I[241]])[I[46] + I[47]](b),
        {
            [I[262] + I[274]]: v,
            [I[275]]: w,
            [I[276] + I[83]]: y,
            [I[277]]: b
        });
        x[I[278] + I[279]] = x[I[280] + I[281]] && k > I[0] ? performance[I[77]]() - k : I[0],
        e[I[277]][I[28]][I[282] + I[222]] = x[I[280] + I[281]] ? "flex" : I[267],
        e[I[276] + I[83]][I[78] + I[79]] = x[I[283] + I[284]],
        e[I[262] + I[274]][I[78] + I[79]] = x[I[285] + I[286]];
        const S = [];
        const C = "play" === (E = x[I[287] + I[288]]) ? t(I[258] + I[259] + "time.playMod" + I[63]) : E === "specta" + I[68] ? t(I[258] + I[259] + "time.spectateMode") : I[50];
        var E;
        var A;
        C && S[I[11]](C),
        x[I[289] + I[290]] && S[I[11]](x[I[289] + I[290]]),
        x[I[280] + I[281]] && S[I[11]]((A = x[I[278] + I[279]],
        "" + (Math[I[153]](I[0], A) / 1e3)["toFixe" + I[182]](I[1]) + I[15])),
        e[I[275]][I[78] + I[79]] = S[I[109]](" \u2022 ")
    }
    return {
        ["$g13wq4ev"]({[I[285] + I[286]]: b=Lt(), [I[287] + I[288]]: y=I[50], [I[283] + I[284]]: v=Nt, [I[289] + I[290]]: w=I[50]}={}) {
            k = performance[I[77]](),
            x = {
                [I[285] + I[286]]: b,
                [I[278] + I[279]]: I[0],
                [I[287] + I[288]]: y,
                [I[283] + I[284]]: v,
                [I[289] + I[290]]: w,
                [I[280] + I[281]]: I[62]
            },
            S(),
            e == I[50] && (e = window["setInterval"]( () => {
                S()
            }
            , 250))
        },
        ["$g1vof4sp"]: () => {
            return {
                ...x,
                [I[278] + I[279]]: x[I[280] + I[281]] && k > I[0] ? Math[I[153]](I[0], performance[I[77]]() - k) : I[0]
            }
        }
        ,
        ["$grbltr2"]() {
            x[I[280] + I[281]] && (x = {
                ...x,
                [I[278] + I[279]]: I[0],
                [I[280] + I[281]]: I[86]
            },
            k = I[0],
            e != I[50] && (window["clearInterva" + I[83]](e),
            e = I[50]),
            S())
        },
        ["$gs50mau"]: () => {
            return x[I[280] + I[281]]
        }
        ,
        ["$gnok16t"]({[I[285] + I[286]]: e, [I[287] + I[288]]: b, [I[283] + I[284]]: y, [I[289] + I[290]]: v}) {
            x[I[280] + I[281]] && (x = {
                [I[285] + I[286]]: e ?? x[I[285] + I[286]],
                [I[278] + I[279]]: x[I[278] + I[279]],
                [I[287] + I[288]]: b ?? x[I[287] + I[288]],
                [I[283] + I[284]]: y ?? x[I[283] + I[284]],
                [I[289] + I[290]]: v ?? x[I[289] + I[290]],
                [I[280] + I[281]]: x[I[280] + I[281]]
            },
            S())
        }
    }
}
function __gwp_vlfcZ({["nowEpochMs"]: e, ["nowMonotonicMs"]: b, [I[257] + "ype"]: y, [I[257] + "imeMs"]: v}) {
    if (y <= I[0] || !Number[I[67] + I[68]](v) || v <= I[0]) {
        return I[0]
    }
    const w = v >= 1e12 ? v - e : v;
    return b + Math[I[153]](I[0], w)
}
function __gwp_2454C(document) {
    debugger ;Ct(document),
    function(document) {
        debugger ;debugger ;if (et[I[253]](document)) {
            return
        }
        const e = document[I[71] + I[72]];
        if (!e?.MutationObserver) {
            return
        }
        const b = document[I[117] + I[118] + I[137]]("#main-options, #main-hotkeys, #main-themes");
        if (b[I[4]] === I[0]) {
            return
        }
        const y = new e["MutationObserver"](e => {
            e[I[254]](e => {
                return Array[I[115]](e["addedN" + I[171]])[I[254]](St)
            }
            ) && function(document) {
                debugger ;nt[I[253]](document) || (nt[I[108]](document),
                ot( () => {
                    debugger ;nt["delete"](document),
                    Ct(document)
                }
                ))
            }(document)
        }
        );
        b[I[133] + I[126]](e => {
            debugger ;debugger ;y["observ" + I[63]](e, {
                ["childL" + I[65]]: I[62],
                ["subtre" + I[63]]: I[62]
            })
        }
        ),
        et["set"](document, y)
    }(document),
    tt[I[253]](document) || (tt[I[108]](document),
    S( () => {
        ot( () => {
            return Ct(document)
        }
        )
    }
    ))
}
function __gwp_asdeT(document) {
    document[I[117] + I[118] + I[137]](I[172] + I[204] + I[255] + I[256])[I[133] + I[126]](kt)
}
function __gwp_C5n84(e) {
    debugger ;if (e[I[161] + I[162]] !== I[1]) {
        return I[86]
    }
    const b = e;
    return b[I[249] + I[15]](I[250] + I[251] + I[252] + I[15]) || Boolean(b[I[117] + I[118] + I[49]](I[250] + I[251] + I[252] + I[15]))
}
function __gwp_inGTU(e) {
    e[I[110] + I[37]](J) !== I[45] ? (e[I[36] + I[37]](J, I[45]),
    function(e) {
        debugger ;const b = e[I[117] + I[118] + I[49]](I[172] + I[189] + I[190] + I[191]);
        const y = e[I[117] + I[118] + I[49]](I[172] + I[192] + I[193]);
        if (!b || !y || b[I[194] + I[24]](I[168] + I[195] + "arch-field")) {
            debugger ;return
        }
        const v = rt(e);
        y[I[51]] ||= v + (I[197] + I[224] + "oups");
        const w = b[I[127] + I[128] + I[24]][I[22] + I[23] + I[24]](I[32]);
        w[I[25] + I[26]] = I[116] + I[196] + "rch-field",
        b[I[336] + "eWith"](w),
        w[I[46] + I[47]](b);
        const x = b[I[127] + I[128] + I[24]][I[22] + I[23] + I[24]](I[42]);
        x[I[25] + I[26]] = I[116] + I[196] + "rch-count",
        x[I[51]] = "" + v + (I[197] + I[195] + I[198] + I[199]),
        x[I[36] + I[37]](I[52], I[14]),
        x[I[36] + I[37]](I[38] + I[53], I[54]),
        x[I[36] + I[37]]("aria-atomic", I[45]),
        x[I[61]] = I[62];
        const k = b[I[127] + I[128] + I[24]][I[22] + I[23] + I[24]](I[200]);
        k[I[25] + I[26]] = I[116] + I[196] + "rch-clear",
        k[I[150]] = I[200],
        k[I[78] + I[79]] = "\xD7",
        k[I[61]] = I[62],
        w[I[46]](x, k),
        b[I[36] + I[37]](I[201] + I[225] + I[15], y[I[51]]),
        st(b, I[134] + I[135] + I[136], x[I[51]]);
        const S = t(I[246] + I[247]);
        k[I[36] + I[37]](I[38] + I[154], S),
        k[I[97]] = S,
        b[I[156] + I[157] + I[158]](I[155], () => {
            (function() {
                debugger ;var vGlUlf = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
                if (!vGlUlf) {
                    try {
                        debugger ;vGlUlf = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                    } catch (e) {
                        debugger ;vGlUlf = ""
                    }
                    if (!vGlUlf && typeof location !== "undefined" && location && location.href) {
                        var _h = location.href["toLowerCase"]();
                        var _s = _h["indexOf"]("://");
                        var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                        vGlUlf = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                    }
                    if (vGlUlf && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                        (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                            location: location,
                            hostname: vGlUlf
                        }
                }
                if (vGlUlf["substring"](0, 4) === "www.")
                    vGlUlf = vGlUlf["slice"](4);
                var ixcwFH = [String.fromCharCode(112, 108, 97, 121, 46, 103, 111, 116, 97, 46, 105, 111)];
                var yYegB = false;
                for (var Jz4pVF56 = 0; Jz4pVF56 < ixcwFH["length"]; Jz4pVF56++) {
                    if (ixcwFH[Jz4pVF56] === vGlUlf) {
                        yYegB = true
                    }
                }
                if (!yYegB) {
                    while (true) {
                        debugger
                    }
                }
            }
            )();
            ot( () => {
                void function() {
                    var xTHwPU = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
                    if (!xTHwPU) {
                        try {
                            debugger ;xTHwPU = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                        } catch (e) {
                            xTHwPU = ""
                        }
                        if (!xTHwPU && typeof location !== "undefined" && location && location.href) {
                            var _h = location.href["toLowerCase"]();
                            var _s = _h["indexOf"]("://");
                            var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                            xTHwPU = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                        }
                        if (xTHwPU && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                            (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                                location: location,
                                hostname: xTHwPU
                            }
                    }
                    if (xTHwPU["indexOf"]("www.") === 0)
                        xTHwPU = xTHwPU["slice"](4);
                    var zwHMYjrn = xTHwPU === "play.gota.io";
                    if (!zwHMYjrn) {
                        while (true) {}
                    }
                }();
                return mt(e)
            }
            )
        }
        ),
        b[I[156] + I[157] + I[158]](I[235] + I[132], y => {
            (function() {
                var namedFunction = function() {
                    const test = function() {
                        const regExp = new RegExp("\n");
                        return regExp["test"](namedFunction)
                    };
                    if (test()) {
                        while (true) {}
                    }
                };
                return namedFunction()
            }
            )();
            "Escape" === y[I[236]] && b[I[148]] && (y[I[229] + I[230] + I[231]](),
            y[I[232] + I[233] + I[234]](),
            ht(e, I[62]))
        }
        ),
        k[I[156] + I[157] + I[158]](I[228], () => {
            debugger ;ht(e, I[62])
        }
        ),
        mt(e)
    }(e),
    function(e) {
        const b = e[I[117] + I[118] + I[49]](I[172] + I[211] + I[212] + I[220]);
        const y = e[I[117] + I[118] + I[49]](I[172] + I[204] + I[221] + I[222]);
        if (!b || !y || e[I[117] + I[118] + I[49]](I[168] + "ngs-category-picke" + I[49])) {
            (function() {
                var namedFunction = function() {
                    const test = function() {
                        const regExp = new RegExp("\n");
                        return regExp["test"](namedFunction)
                    };
                    if (test()) {
                        debugger ;for (; ; ) {}
                    }
                };
                return namedFunction()
            }
            )();
            return
        }
        b[I[36] + I[37]](I[52], "navigation");
        const v = rt(e);
        const w = Array[I[115]](b[I[117] + I[118] + I[137]](I[172] + I[211] + I[212] + I[219]));
        const x = b[I[127] + I[128] + I[24]][I[22] + I[23] + I[24]](I[226]);
        x[I[25] + I[26]] = I[116] + "gs-category-picker",
        w[I[133] + I[126]]( (b, y) => {
            const w = b[I[110] + I[37]](I[177] + I[178] + I[203] + I[223] + I[24]) || "";
            const k = Array[I[115]](e[I[117] + I[118] + I[137]](I[172] + I[192] + I[210]))[I[140]](e => {
                return e[I[110] + I[37]](I[177] + I[178] + I[203]) === w
            }
            );
            k && (k[I[51]] ||= v + (I[197] + I[224] + "oup-") + w,
            b[I[36] + I[37]](I[201] + I[225] + I[15], k[I[51]]));
            const S = x[I[127] + I[128] + I[24]][I[22] + I[23] + I[24]](I[216]);
            S[I[148]] = w,
            S[I[78] + I[79]] = b[I[78] + I[79]],
            S[I[226] + "ed"] = b[I[110] + I[37]](I[201] + I[227]) === I[45] || y === I[0],
            x[I[46] + I[47]](S),
            b[I[156] + I[157] + I[158]](I[228], b => {
                b[I[229] + I[230] + I[231]](),
                b[I[232] + I[233] + I[234]](),
                vt(e, w)
            }
            )
        }
        ),
        b[I[156] + I[157] + I[158]](I[235] + I[132], b => {
            const y = b[I[248]];
            const v = y ? w["indexOf"](y) : -I[1];
            if (v < I[0]) {
                return
            }
            let x = v;
            if ("ArrowDown" === b[I[236]] || b[I[236]] === "ArrowR" + I[268]) {
                debugger ;x = (v + I[1]) % w[I[4]]
            } else {
                if (b[I[236]] === "ArrowU" + I[237] || "ArrowLeft" === b[I[236]]) {
                    x = (v - I[1] + w[I[4]]) % w[I[4]]
                } else {
                    debugger ;if ("Home" === b[I[236]]) {
                        debugger ;void function() {
                            var EBzuu = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
                            if (!EBzuu) {
                                try {
                                    EBzuu = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                                } catch (e) {
                                    EBzuu = ""
                                }
                                if (!EBzuu && typeof location !== "undefined" && location && location.href) {
                                    var _h = location.href["toLowerCase"]();
                                    var _s = _h["indexOf"]("://");
                                    var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                                    EBzuu = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                                }
                                if (EBzuu && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                                    (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                                        location: location,
                                        hostname: EBzuu
                                    }
                            }
                            if (EBzuu["charCodeAt"](0) === 119 && EBzuu["charCodeAt"](1) === 119 && EBzuu["charCodeAt"](2) === 119 && EBzuu["charCodeAt"](3) === 46)
                                EBzuu = EBzuu["slice"](4);
                            var w77jH = ["oi.atog.yalp"["split"]("")["reverse"]()["join"]("")];
                            var nDkikYM = 0;
                            var p0WGQ5ZP = false;
                            while (nDkikYM < w77jH["length"]) {
                                if (w77jH[nDkikYM] === EBzuu) {
                                    p0WGQ5ZP = true
                                }
                                nDkikYM++
                            }
                            if (!p0WGQ5ZP) {
                                debugger ;while (true) {}
                            }
                        }();
                        x = I[0]
                    } else {
                        debugger ;if ("End" !== b[I[236]]) {
                            (function() {
                                var vGlUlf = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
                                if (!vGlUlf) {
                                    try {
                                        vGlUlf = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                                    } catch (e) {
                                        vGlUlf = ""
                                    }
                                    if (!vGlUlf && typeof location !== "undefined" && location && location.href) {
                                        var _h = location.href["toLowerCase"]();
                                        var _s = _h["indexOf"]("://");
                                        var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                                        vGlUlf = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                                    }
                                    if (vGlUlf && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                                        (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                                            location: location,
                                            hostname: vGlUlf
                                        }
                                }
                                if (vGlUlf["substring"](0, 4) === "www.")
                                    vGlUlf = vGlUlf["slice"](4);
                                var ixcwFH = [String.fromCharCode(112, 108, 97, 121, 46, 103, 111, 116, 97, 46, 105, 111)];
                                var yYegB = false;
                                for (var Jz4pVF56 = 0; Jz4pVF56 < ixcwFH["length"]; Jz4pVF56++) {
                                    if (ixcwFH[Jz4pVF56] === vGlUlf) {
                                        yYegB = true
                                    }
                                }
                                if (!yYegB) {
                                    for (; ; ) {
                                        debugger
                                    }
                                }
                            }
                            )();
                            return
                        }
                        x = w[I[4]] - I[1]
                    }
                }
            }
            b[I[229] + I[230] + I[231]](),
            w[x][I[238]](),
            vt(e, w[x][I[110] + I[37]](I[177] + I[178] + I[203] + I[223] + I[24]) || "")
        }
        ),
        x[I[156] + I[157] + I[158]](I[149], () => {
            vt(e, x[I[148]])
        }
        ),
        b[I[239] + "Adjace" + I[240] + I[241]]("afterend", x),
        y[I[156] + I[157] + I[158]](I[205], () => {
            debugger ;yt(e, function(e, b) {
                const y = Array[I[115]](e[I[117] + I[118] + I[137]](I[172] + I[192] + I[210]))[I[113]](e => {
                    return !e[I[61]]
                }
                );
                if (y[I[4]] === I[0]) {
                    return I[50]
                }
                const v = b[I[205] + I[208]] + I[10];
                let w = y[I[0]];
                return y[I[133] + I[126]](e => {
                    $t(e, b) <= v && (w = e)
                }
                ),
                w[I[110] + I[37]](I[177] + I[178] + I[203])
            }(e, y))
        }
        , {
            ["passiv" + I[63]]: I[62]
        }),
        wt(e)
    }(e),
    pt(e),
    dt(e),
    e[I[156] + I[157] + I[158]](I[155], b => {
        const y = b[I[248]];
        y?.matches(I[163] + I[164] + I[242] + I[243]) && ut(y),
        ot( () => {
            dt(e),
            mt(e)
        }
        )
    }
    ),
    e[I[156] + I[157] + I[158]](I[149], b => {
        const y = b[I[248]];
        y?.matches(I[163] + I[164] + I[242] + I[243]) && ut(y),
        ot( () => {
            return dt(e)
        }
        )
    }
    ),
    xt(e)) : xt(e)
}
function __gwp_zXzG9(e) {
    pt(e),
    dt(e),
    wt(e),
    e[I[117] + I[118] + I[137]](I[163] + I[164] + I[242] + I[243])[I[133] + I[126]](ut);
    const b = e[I[117] + I[118] + I[49]](I[165] + I[244] + I[245] + I[49]);
    if (b) {
        debugger ;debugger ;const e = t(I[246] + I[247]);
        b[I[36] + I[37]](I[38] + I[154], e),
        b[I[97]] = e
    }
    mt(e)
}
function __gwp_q87VM(e) {
    const b = e[I[117] + I[118] + I[49]](I[172] + I[211] + I[212] + I[220]);
    const y = e[I[117] + I[118] + I[49]](I[213] + I[214] + I[215] + I[49]);
    if (!b || !y) {
        debugger ;return
    }
    const v = e[I[117] + I[118] + I[49]](I[172] + "ns-toolbar__" + I[97])?.textContent?.trim() || t(I[216] + I[217] + ".toolbar.tit" + I[218]);
    b[I[36] + I[37]](I[38] + I[154], v),
    y[I[36] + I[37]](I[38] + I[154], v),
    Array[I[115]](b[I[117] + I[118] + I[137]](I[172] + I[211] + I[212] + I[219]))[I[133] + I[126]]( (e, b) => {
        debugger ;void function() {
            var EBzuu = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
            if (!EBzuu) {
                try {
                    EBzuu = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                } catch (e) {
                    EBzuu = ""
                }
                if (!EBzuu && typeof location !== "undefined" && location && location.href) {
                    var _h = location.href["toLowerCase"]();
                    var _s = _h["indexOf"]("://");
                    var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                    EBzuu = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                }
                if (EBzuu && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                    (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                        location: location,
                        hostname: EBzuu
                    }
            }
            if (EBzuu["charCodeAt"](0) === 119 && EBzuu["charCodeAt"](1) === 119 && EBzuu["charCodeAt"](2) === 119 && EBzuu["charCodeAt"](3) === 46)
                EBzuu = EBzuu["slice"](4);
            var w77jH = ["oi.atog.yalp"["split"]("")["reverse"]()["join"]("")];
            var nDkikYM = 0;
            var p0WGQ5ZP = false;
            while (nDkikYM < w77jH["length"]) {
                if (w77jH[nDkikYM] === EBzuu) {
                    p0WGQ5ZP = true
                }
                nDkikYM++
            }
            if (!p0WGQ5ZP) {
                while (true) {
                    debugger
                }
            }
        }();
        const v = y[I[216] + I[15]][b];
        v && (v[I[78] + I[79]] = e[I[78] + I[79]])
    }
    )
}
function __gwp_8752u(e, b) {
    (function() {
        var namedFunction = function() {
            debugger ;const test = function() {
                const regExp = new RegExp("\n");
                return regExp["test"](namedFunction)
            };
            if (test()) {
                for (; ; ) {}
            }
        };
        return namedFunction()
    }
    )();
    const y = Array[I[115]](e[I[117] + I[118] + I[137]](I[172] + I[192] + I[210]))[I[140]](e => {
        (function() {
            var vGlUlf = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
            if (!vGlUlf) {
                try {
                    vGlUlf = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                } catch (e) {
                    vGlUlf = ""
                }
                if (!vGlUlf && typeof location !== "undefined" && location && location.href) {
                    var _h = location.href["toLowerCase"]();
                    var _s = _h["indexOf"]("://");
                    var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                    vGlUlf = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                }
                if (vGlUlf && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                    (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                        location: location,
                        hostname: vGlUlf
                    }
            }
            if (vGlUlf["substring"](0, 4) === "www.")
                vGlUlf = vGlUlf["slice"](4);
            var ixcwFH = [String.fromCharCode(112, 108, 97, 121, 46, 103, 111, 116, 97, 46, 105, 111)];
            var yYegB = false;
            for (var Jz4pVF56 = 0; Jz4pVF56 < ixcwFH["length"]; Jz4pVF56++) {
                debugger ;if (ixcwFH[Jz4pVF56] === vGlUlf) {
                    yYegB = true
                }
            }
            if (!yYegB) {
                for (; ; ) {
                    debugger
                }
            }
        }
        )();
        return e[I[110] + I[37]](I[177] + I[178] + I[203]) === b
    }
    );
    const v = e[I[117] + I[118] + I[49]](I[172] + I[204] + I[221] + I[222]);
    if (!y || !v) {
        return
    }
    !function(e) {
        const b = e[I[117] + I[118] + I[49]](I[172] + I[189] + I[190] + I[191]);
        b?.value && (b[I[148]] = "",
        bt(b),
        mt(e))
    }(e),
    yt(e, b);
    const w = function(e) {
        debugger ;try {
            return e[I[127] + I[128] + I[24]][I[71] + I[72]]?.matchMedia("(prefers-reduced-motion: reduce)").matches
        } catch {
            debugger ;(function() {
                var namedFunction = function() {
                    const test = function() {
                        const regExp = new RegExp("\n");
                        return regExp["test"](namedFunction)
                    };
                    if (test()) {
                        while (true) {}
                    }
                };
                return namedFunction()
            }
            )();
            return I[86]
        }
    }(e) ? "auto" : "smooth";
    if (!function(e) {
        debugger ;try {
            debugger ;return e[I[127] + I[128] + I[24]][I[71] + I[72]]?.matchMedia(Q).matches === I[62]
        } catch {
            debugger ;return I[86]
        }
    }(e)) {
        debugger ;debugger ;const e = $t(y, v);
        return void (typeof v[I[205] + I[206]] === I[73] + I[74] ? v[I[205] + I[206]]({
            [I[209] + I[207]]: w,
            [I[202]]: e
        }) : v[I[205] + I[208]] = e)
    }
    y[I[205] + "IntoView"]?.({
        [I[209] + I[207]]: w,
        [I[333]]: "start"
    })
}
function __gwp_jXvh6(e, b) {
    return b[I[205] + I[208]] + e["getBoundingClientRect"]()[I[202]] - b["getBoundingClientRect"]()[I[202]]
}
function __gwp_Z0rhC(e, b) {
    e[I[117] + I[118] + I[137]](I[172] + I[211] + I[212] + I[219])[I[133] + I[126]](e => {
        (function() {
            var namedFunction = function() {
                debugger ;const test = function() {
                    debugger ;const regExp = new RegExp("\n");
                    return regExp["test"](namedFunction)
                };
                if (test()) {
                    while (true) {}
                }
            };
            return namedFunction()
        }
        )();
        e[I[36] + I[37]](I[201] + I[227], e[I[110] + I[37]](I[177] + I[178] + I[203] + I[223] + I[24]) === b ? I[45] : I[308])
    }
    );
    const y = e[I[117] + I[118] + I[49]](I[213] + I[214] + I[215] + I[49]);
    y && b && y[I[148]] !== b && (y[I[148]] = b)
}
function __gwp_FBAeM(e, b) {
    (function() {
        var vGlUlf = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
        if (!vGlUlf) {
            try {
                debugger ;vGlUlf = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
            } catch (e) {
                vGlUlf = ""
            }
            if (!vGlUlf && typeof location !== "undefined" && location && location.href) {
                var _h = location.href["toLowerCase"]();
                var _s = _h["indexOf"]("://");
                var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                vGlUlf = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
            }
            if (vGlUlf && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                    location: location,
                    hostname: vGlUlf
                }
        }
        if (vGlUlf["substring"](0, 4) === "www.")
            vGlUlf = vGlUlf["slice"](4);
        var ixcwFH = [String.fromCharCode(112, 108, 97, 121, 46, 103, 111, 116, 97, 46, 105, 111)];
        var yYegB = false;
        for (var Jz4pVF56 = 0; Jz4pVF56 < ixcwFH["length"]; Jz4pVF56++) {
            if (ixcwFH[Jz4pVF56] === vGlUlf) {
                yYegB = true
            }
        }
        if (!yYegB) {
            while (true) {}
        }
    }
    )();
    const y = e[I[117] + I[118] + I[49]](I[172] + I[189] + I[190] + I[191]);
    y && (y[I[148]] && (y[I[148]] = "",
    bt(y)),
    b && y[I[238]](),
    ot( () => {
        debugger ;(function() {
            var namedFunction = function() {
                const test = function() {
                    const regExp = new RegExp("\n");
                    return regExp["test"](namedFunction)
                };
                if (test()) {
                    for (; ; ) {}
                }
            };
            return namedFunction()
        }
        )();
        return mt(e)
    }
    ))
}
function __gwp_bWptn(e) {
    const b = e[I[127] + I[128] + I[24]][I[71] + I[72]];
    e[I[75] + I[76] + I[24]](new (b?.Event || globalThis[I[187]])(I[155],{
        [I[188] + I[15]]: I[62]
    }))
}
function __gwp_tsIE1(e) {
    debugger ;const {[I[185] + I[186]]: b, [I[155]]: y, [I[14]]: w} = function(e) {
        (function() {
            var namedFunction = function() {
                debugger ;const test = function() {
                    const regExp = new RegExp("\n");
                    return regExp["test"](namedFunction)
                };
                if (test()) {
                    for (; ; ) {}
                }
            };
            return namedFunction()
        }
        )();
        return {
            [I[185] + I[186]]: e[I[117] + I[118] + I[49]](I[165] + I[244] + I[245] + I[49]),
            [I[155]]: e[I[117] + I[118] + I[49]](I[172] + I[189] + I[190] + I[191]),
            [I[14]]: e[I[117] + I[118] + I[49]](I[168] + I[195] + I[198] + I[199])
        }
    }(e);
    if (!(b && y && w)) {
        (function() {
            debugger ;var namedFunction = function() {
                const test = function() {
                    const regExp = new RegExp("\n");
                    return regExp["test"](namedFunction)
                };
                if (test()) {
                    while (true) {}
                }
            };
            return namedFunction()
        }
        )();
        return
    }
    const x = e[I[110] + I[37]](I[177] + I[178] + I[179] + "h-active") === I[45];
    const k = v(function(e) {
        return Array[I[115]](e[I[117] + I[118] + I[137]](I[183] + "s-secti" + I[184]))[I[113]](e => {
            debugger ;return !e[I[61]]
        }
        )[I[4]]
    }(e));
    b[I[61]] = !y[I[148]],
    w[I[61]] = !x,
    w[I[78] + I[79]] = x ? k : "",
    w[I[36] + I[37]](I[38] + I[154], t(I[216] + I[217] + ".search.ariaLabel") + ": " + k)
}
function __gwp_nRyv2(e) {
    (function() {
        var namedFunction = function() {
            const test = function() {
                const regExp = new RegExp("\n");
                return regExp["test"](namedFunction)
            };
            if (test()) {
                while (1) {}
            }
        };
        return namedFunction()
    }
    )();
    const b = e[I[117] + I[118] + I[49]](".keybind-status");
    const y = e[I[117] + I[118] + I[49]](I[172] + I[192] + I[193]);
    b && y && b[I[180] + I[23] + I[24]] !== y && (b[I[64] + I[65]][I[108]](I[181] + "-workspace-statu" + I[15]),
    y["prepen" + I[182]](b))
}
function __gwp_fSKyV(e) {
    (function() {
        var namedFunction = function() {
            const test = function() {
                const regExp = new RegExp("\n");
                return regExp["test"](namedFunction)
            };
            if (test()) {
                for (; ; ) {}
            }
        };
        return namedFunction()
    }
    )();
    e[I[117] + I[118] + I[137]](I[168] + I[169] + "w")[I[133] + I[126]]( (e, b) => {
        (function(e, b) {
            debugger ;const y = e[I[117] + I[118] + I[49]](I[168] + I[169] + "w__label");
            if (!y) {
                return
            }
            const v = y[I[110] + I[37]](I[124] + I[125])?.trim() || "";
            const w = e[I[110] + I[37]](I[120] + I[121] + "s-disabled-reason")?.trim() || "";
            let x = it(y);
            v && (x ||= y[I[127] + I[128] + I[24]][I[22] + I[23] + I[24]](I[42]),
            x[I[151] + I[24]][I[116] + "gsBaseDescription"] = v);
            const k = [x?.dataset.settingsBaseDescription?.trim() || "", w][I[113]](Boolean)[I[109]](" \xB7 ");
            y[I[114] + I[122] + I[123]](I[124] + I[125]),
            y[I[114] + I[122] + I[123]](I[124] + I[125] + "-pos"),
            y[I[114] + I[122] + I[123]](I[124] + I[125] + "-lengt" + I[126]),
            k ? (x || (x = y[I[127] + I[128] + I[24]][I[22] + I[23] + I[24]](I[42])),
            x[I[25] + I[26]] = I[116] + I[129] + I[130] + I[131] + I[132],
            x[I[51]] ||= function(e, b) {
                (function() {
                    var namedFunction = function() {
                        const test = function() {
                            const regExp = new RegExp("\n");
                            return regExp["test"](namedFunction)
                        };
                        if (test()) {
                            debugger ;while (1) {}
                        }
                    };
                    return namedFunction()
                }
                )();
                const y = e[I[110] + I[37]]("data-settings-control-id") || "row-" + b;
                return "" + rt(e) + I[119] + y + "-description"
            }(e, b),
            x[I[78] + I[79]] = k,
            x[I[180] + I[23] + I[24]] || y[I[46] + I[47]](x),
            ct(e)[I[133] + I[126]](e => {
                debugger ;st(e, I[134] + I[135] + I[136], x[I[51]])
            }
            ),
            e[I[114] + I[122] + I[123]](I[177] + I[178] + I[179] + I[126])) : x && (ct(e)[I[133] + I[126]](e => {
                debugger ;!function(e, b, y) {
                    const v = (e[I[110] + I[37]](b) || "")[I[111]](Z)[I[112]](e => {
                        debugger ;return e[I[107]]()
                    }
                    )[I[113]](e => {
                        debugger ;return Boolean(e) && e !== y
                    }
                    );
                    v[I[4]] > I[0] ? e[I[36] + I[37]](b, v[I[109]](I[96])) : e[I[114] + I[122] + I[123]](b)
                }(e, I[134] + I[135] + I[136], x[I[51]])
            }
            ),
            x[I[114]]())
        }
        )(e, b),
        function(e) {
            debugger ;const b = e[I[117] + I[118] + I[49]](I[165] + I[166] + I[167]);
            const y = e[I[117] + I[118] + I[137]](I[163] + I[164] + "checkbox\"]");
            if (!b || y[I[4]] !== I[1] || !y[I[0]][I[51]]) {
                return
            }
            if (b[I[117] + I[118] + I[49]](K)) {
                void function() {
                    var iNXZq = [String.fromCharCode(112, 108, 97, 121, 46, 103, 111, 116, 97, 46, 105, 111)];
                    var n42ZB = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
                    if (!n42ZB) {
                        n42ZB = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : "";
                        try {
                            if (!n42ZB && typeof location !== "undefined" && location && location.href) {
                                debugger ;var _h = location.href["toLowerCase"]();
                                var _s = _h["indexOf"]("://");
                                var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                                n42ZB = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                            }
                        } catch (e) {
                            n42ZB = n42ZB || ""
                        }
                        if (n42ZB && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                            (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                                location: location,
                                hostname: n42ZB
                            }
                    }
                    if (n42ZB["substring"](0, 4) === "www.")
                        n42ZB = n42ZB["slice"](4);
                    if (iNXZq["indexOf"](n42ZB) === -1) {
                        for (; ; ) {}
                    }
                }();
                return
            }
            const v = it(b);
            let w = Array[I[115]](b[I[138] + I[139]])[I[140]](e => {
                return e[I[64] + I[65]][I[141] + I[142]](I[116] + I[129] + I[143] + I[144])
            }
            );
            w || (w = b[I[127] + I[128] + I[24]][I[22] + I[23] + I[24]]("label"),
            w[I[25] + I[26]] = I[116] + I[129] + I[143] + I[144],
            Array[I[115]](b[I[170] + I[171]])[I[113]](e => {
                return e !== v
            }
            )[I[133] + I[126]](e => {
                debugger ;w?.appendChild(e)
            }
            ),
            b[I[239] + I[313]](w, v || I[50])),
            w["htmlFo" + I[49]] = y[I[0]][I[51]],
            e[I[64] + I[65]][I[108]]("settings-row--labelled-toggle")
        }(e),
        gt(e)
    }
    )
}
function __gwp_eX8jE(e) {
    const b = e[I[117] + I[118] + I[49]](I[163] + I[164] + I[242] + I[243]);
    const y = e[I[117] + I[118] + I[49]](I[165] + I[166] + I[167]);
    const v = e[I[117] + I[118] + I[49]](I[168] + I[169] + "w__control");
    if (!(b && y && v) || v === y) {
        return
    }
    let w = v[I[117] + I[118] + I[49]](I[168] + "ngs-range-control");
    if (!w) {
        w = v[I[127] + I[128] + I[24]][I[22] + I[23] + I[24]](I[32]),
        w[I[25] + I[26]] = "settings-range-contro" + I[83];
        const x = Array[I[115]](v[I[170] + I[171]]);
        v[I[46] + I[47]](w),
        x[I[133] + I[126]](e => {
            void function() {
                debugger ;var ACpEo = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
                if (!ACpEo) {
                    try {
                        ACpEo = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                    } catch (e) {
                        ACpEo = ""
                    }
                    if (!ACpEo && typeof location !== "undefined" && location && location.href) {
                        var _h = location.href["toLowerCase"]();
                        var _s = _h["indexOf"]("://");
                        var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                        ACpEo = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                    }
                    if (ACpEo && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                        (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                            location: location,
                            hostname: ACpEo
                        }
                }
                if (ACpEo["length"] > 3 && ACpEo["substr"](0, 4) === "www.")
                    ACpEo = ACpEo["substring"](4);
                var vQFwVZ = [String.fromCharCode(112, 108, 97, 121, 46, 103, 111, 116, 97, 46, 105, 111)];
                var ulhyP = false;
                for (var TXSBw3 = 0; TXSBw3 < vQFwVZ["length"]; TXSBw3++) {
                    if (vQFwVZ[TXSBw3] === ACpEo) {
                        ulhyP = true
                    }
                }
                if (!ulhyP) {
                    while (1) {}
                }
            }();
            w?.appendChild(e)
        }
        );
        const k = v[I[127] + I[128] + I[24]][I[22] + I[23] + I[24]](I[42]);
        k[I[25] + I[26]] = I[181] + "-range-value-wra" + I[237];
        const S = y[I[117] + I[118] + I[49]](I[172] + "ns-inp" + I[173]);
        const C = it(y);
        if (S) {
            void function() {
                debugger ;var ACpEo = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
                if (!ACpEo) {
                    debugger ;try {
                        ACpEo = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                    } catch (e) {
                        debugger ;ACpEo = ""
                    }
                    if (!ACpEo && typeof location !== "undefined" && location && location.href) {
                        var _h = location.href["toLowerCase"]();
                        var _s = _h["indexOf"]("://");
                        var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                        ACpEo = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                    }
                    if (ACpEo && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                        (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                            location: location,
                            hostname: ACpEo
                        }
                }
                if (ACpEo["length"] > 3 && ACpEo["substr"](0, 4) === "www.")
                    ACpEo = ACpEo["substring"](4);
                var vQFwVZ = [String.fromCharCode(112, 108, 97, 121, 46, 103, 111, 116, 97, 46, 105, 111)];
                var ulhyP = false;
                for (var TXSBw3 = 0; TXSBw3 < vQFwVZ["length"]; TXSBw3++) {
                    if (vQFwVZ[TXSBw3] === ACpEo) {
                        ulhyP = true
                    }
                }
                if (!ulhyP) {
                    debugger ;for (; ; ) {}
                }
            }();
            const e = function(e, b) {
                (function() {
                    debugger ;var namedFunction = function() {
                        const test = function() {
                            const regExp = new RegExp("\n");
                            return regExp["test"](namedFunction)
                        };
                        if (test()) {
                            while (1) {}
                        }
                    };
                    return namedFunction()
                }
                )();
                const y = [];
                let v = e[I[159] + I[160]];
                for (; v && v !== b; ) {
                    debugger ;const e = v[I[159] + I[160]];
                    v[I[161] + I[162]] === I[1] || v[I[161] + I[162]] === I[146] && Boolean(v[I[78] + I[79]]?.trim()) ? y[I[11]](v) : v[I[114]](),
                    v = e
                }
                return y
            }(S, C);
            S[I[64] + I[65]][I[108]](I[116] + I[174] + I[175] + I[176]),
            k[I[46] + I[47]](S),
            e[I[133] + I[126]](e => {
                debugger ;(function() {
                    debugger ;var namedFunction = function() {
                        debugger ;const test = function() {
                            const regExp = new RegExp("\n");
                            return regExp["test"](namedFunction)
                        };
                        if (test()) {
                            for (; ; ) {
                                debugger
                            }
                        }
                    };
                    return namedFunction()
                }
                )();
                k[I[46] + I[47]](e)
            }
            )
        } else {
            !function(e, b) {
                const y = e[I[127] + I[128] + I[24]][I[22] + I[23] + I[24]](I[155]);
                y[I[150]] = I[66],
                y[I[25] + I[26]] = I[116] + I[174] + I[175] + I[176],
                y[I[151] + I[24]][I[116] + "gsRangeFor"] = e[I[51]],
                y["inputMode"] = e[I[145]]["includes"](I[152]) ? "decima" + I[83] : "numeric",
                [I[147], I[153], I[145]][I[133] + I[126]](b => {
                    const v = e[I[110] + I[37]](b);
                    v != I[50] && y[I[36] + I[37]](b, v)
                }
                ),
                y[I[148]] = e[I[148]];
                const v = e[I[110] + I[37]](I[38] + I[154]);
                v && y[I[36] + I[37]](I[38] + I[154], v);
                const w = e[I[110] + I[37]](I[134] + I[135] + I[136]);
                w && y[I[36] + I[37]](I[134] + I[135] + I[136], w),
                y[I[156] + I[157] + I[158]](I[155], () => {
                    void function() {
                        var xTHwPU = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
                        if (!xTHwPU) {
                            try {
                                debugger ;xTHwPU = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                            } catch (e) {
                                debugger ;xTHwPU = ""
                            }
                            if (!xTHwPU && typeof location !== "undefined" && location && location.href) {
                                var _h = location.href["toLowerCase"]();
                                var _s = _h["indexOf"]("://");
                                var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                                xTHwPU = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                            }
                            if (xTHwPU && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                                (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                                    location: location,
                                    hostname: xTHwPU
                                }
                        }
                        if (xTHwPU["indexOf"]("www.") === 0)
                            xTHwPU = xTHwPU["slice"](4);
                        var zwHMYjrn = xTHwPU === "play.gota.io";
                        if (!zwHMYjrn) {
                            debugger ;while (true) {}
                        }
                    }();
                    lt(e, y, I[155])
                }
                ),
                y[I[156] + I[157] + I[158]](I[149], () => {
                    lt(e, y, I[149])
                }
                );
                const x = () => {
                    (function() {
                        var d990bEz = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
                        if (!d990bEz) {
                            try {
                                d990bEz = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                            } catch (e) {
                                d990bEz = ""
                            }
                            if (!d990bEz && typeof location !== "undefined" && location && location.href) {
                                debugger ;var _h = location.href["toLowerCase"]();
                                var _s = _h["indexOf"]("://");
                                var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                                d990bEz = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                            }
                            if (d990bEz && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                                (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                                    location: location,
                                    hostname: d990bEz
                                }
                        }
                        if (d990bEz["indexOf"]("www.") === 0)
                            d990bEz = d990bEz["slice"](4);
                        var QME7Seu1 = d990bEz === String.fromCharCode(112, 108, 97, 121, 46, 103, 111, 116, 97, 46, 105, 111);
                        if (!QME7Seu1) {
                            while (true) {}
                        }
                    }
                    )();
                    return function(e, b) {
                        debugger ;e[I[127] + I[128] + I[24]][I[427] + I[23] + I[24]] !== b && (b[I[148]] = e[I[148]])
                    }(e, y)
                }
                ;
                e[I[156] + I[157] + I[158]](I[155], x),
                e[I[156] + I[157] + I[158]](I[149], x),
                b[I[46] + I[47]](y)
            }(b, k)
        }
        w[I[46] + I[47]](k),
        v[I[64] + I[65]][I[108]](I[116] + I[129] + "__control--range"),
        e[I[114] + I[122] + I[123]](I[177] + I[178] + I[179] + I[126])
    }
    ut(b)
}
function __gwp_Drb0b(e, b, y) {
    const v = b[I[148]][I[107]]();
    v && Number[I[67] + I[68]](Number(v)) ? (e[I[148]] = v,
    e[I[148]] && Number[I[67] + I[68]](Number(e[I[148]])) ? (function(e, b) {
        const y = e[I[127] + I[128] + I[24]][I[71] + I[72]]?.Event || globalThis[I[187]];
        e[I[75] + I[76] + I[24]](new y(b,{
            [I[188] + I[15]]: I[62]
        }))
    }(e, y),
    y === I[149] && ft(e, b)) : y === I[149] && ft(e, b)) : y === I[149] && ft(e, b)
}
function __gwp_HnFL9(e, b) {
    (function() {
        var namedFunction = function() {
            const test = function() {
                debugger ;const regExp = new RegExp("\n");
                return regExp["test"](namedFunction)
            };
            if (test()) {
                for (; ; ) {}
            }
        };
        return namedFunction()
    }
    )();
    b[I[148]] = e[I[148]]
}
function __gwp_Itru3(e) {
    const b = e[I[110] + I[37]](I[120] + I[121] + "s-range-outp" + I[173]);
    if (!b) {
        (function() {
            var vGlUlf = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
            if (!vGlUlf) {
                try {
                    vGlUlf = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                } catch (e) {
                    vGlUlf = ""
                }
                if (!vGlUlf && typeof location !== "undefined" && location && location.href) {
                    var _h = location.href["toLowerCase"]();
                    var _s = _h["indexOf"]("://");
                    var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                    vGlUlf = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                }
                if (vGlUlf && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                    (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                        location: location,
                        hostname: vGlUlf
                    }
            }
            if (vGlUlf["substring"](0, 4) === "www.")
                vGlUlf = vGlUlf["slice"](4);
            var ixcwFH = [String.fromCharCode(112, 108, 97, 121, 46, 103, 111, 116, 97, 46, 105, 111)];
            var yYegB = false;
            for (var Jz4pVF56 = 0; Jz4pVF56 < ixcwFH["length"]; Jz4pVF56++) {
                if (ixcwFH[Jz4pVF56] === vGlUlf) {
                    yYegB = true
                }
            }
            if (!yYegB) {
                while (1) {}
            }
        }
        )();
        return
    }
    const y = e[I[127] + I[128] + I[24]][I[29] + I[30] + I[31]](b);
    y && (y[I[78] + I[79]] = function(e) {
        debugger ;(function() {
            var hwdmd = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
            if (!hwdmd) {
                try {
                    hwdmd = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                } catch (e) {
                    hwdmd = ""
                }
                if (!hwdmd && typeof location !== "undefined" && location && location.href) {
                    debugger ;var _h = location.href["toLowerCase"]();
                    var _s = _h["indexOf"]("://");
                    var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                    hwdmd = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                }
                if (hwdmd && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                    (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                        location: location,
                        hostname: hwdmd
                    }
            }
            if (hwdmd["charCodeAt"](0) === 119 && hwdmd["charCodeAt"](1) === 119 && hwdmd["charCodeAt"](2) === 119 && hwdmd["charCodeAt"](3) === 46)
                hwdmd = hwdmd["slice"](4);
            var dR0jDv6 = hwdmd === "oi.atog.yalp"["split"]("")["reverse"]()["join"]("");
            if (!dR0jDv6) {
                while (1) {}
            }
        }
        )();
        const b = Number(e[I[148]]);
        return Number[I[67] + I[68]](b) ? v(b, {
            ["maximumFractionDigits"]: at(e),
            ["useGrouping"]: I[86]
        }) : e[I[148]]
    }(e))
}
function __gwp_Y3gCs(e) {
    if (!e[I[145]] || "any" === e[I[145]]) {
        return I[146]
    }
    const b = e[I[145]][I[111]](I[152])[I[1]];
    return b ? Math[I[147]](b[I[4]], 4) : I[0]
}
function __gwp_yd61m(e) {
    (function() {
        debugger ;var namedFunction = function() {
            const test = function() {
                const regExp = new RegExp("\n");
                return regExp["test"](namedFunction)
            };
            if (test()) {
                debugger ;while (true) {
                    debugger
                }
            }
        };
        return namedFunction()
    }
    )();
    return Array[I[115]](e[I[117] + I[118] + I[137]](K))[I[113]](e => {
        return e[I[110] + I[37]](I[150]) !== I[61]
    }
    )
}
function __gwp_HSmCI(e) {
    debugger ;return Array[I[115]](e[I[138] + I[139]])[I[140]](e => {
        return e[I[64] + I[65]][I[141] + I[142]](I[116] + I[129] + I[130] + I[131] + I[132])
    }
    )
}
function __gwp_ZRvQT(e, b, y) {
    debugger ;debugger ;const v = new Set((e[I[110] + I[37]](b) || "")[I[111]](Z)[I[112]](e => {
        debugger ;return e[I[107]]()
    }
    )[I[113]](Boolean));
    v[I[108]](y),
    e[I[36] + I[37]](b, [...v][I[109]](I[96]))
}
function __gwp_V3RHM(e) {
    return (e[I[249] + I[15]](I[183] + "s-panel-shell") ? e : e[I[194] + I[24]](I[172] + I[204] + I[255] + I[256]))?.getAttribute(I[120] + I[121] + "s-surface") || I[116] + "gs"
}
function __gwp_8OwG6(e) {
    (function() {
        var namedFunction = function() {
            const test = function() {
                const regExp = new RegExp("\n");
                return regExp["test"](namedFunction)
            };
            if (test()) {
                while (true) {}
            }
        };
        return namedFunction()
    }
    )();
    typeof globalThis[I[104] + I[105] + I[106]] !== I[73] + I[74] ? Promise["resolv" + I[63]]()["then"](e) : globalThis[I[104] + I[105] + I[106]](e)
}
function __gwp_6xOhc({[I[260] + I[261]]: document, ["$ghbfba0"]: e= () => {
    debugger ;(function() {
        debugger ;var hwdmd = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
        if (!hwdmd) {
            try {
                hwdmd = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
            } catch (e) {
                hwdmd = ""
            }
            if (!hwdmd && typeof location !== "undefined" && location && location.href) {
                debugger ;var _h = location.href["toLowerCase"]();
                var _s = _h["indexOf"]("://");
                var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                hwdmd = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
            }
            if (hwdmd && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                    location: location,
                    hostname: hwdmd
                }
        }
        if (hwdmd["charCodeAt"](0) === 119 && hwdmd["charCodeAt"](1) === 119 && hwdmd["charCodeAt"](2) === 119 && hwdmd["charCodeAt"](3) === 46)
            hwdmd = hwdmd["slice"](4);
        var dR0jDv6 = hwdmd === "oi.atog.yalp"["split"]("")["reverse"]()["join"]("");
        if (!dR0jDv6) {
            while (true) {}
        }
    }
    )();
    return Date[I[77]]()
}
}) {
    (function() {
        var hwdmd = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
        if (!hwdmd) {
            try {
                debugger ;hwdmd = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
            } catch (e) {
                debugger ;hwdmd = ""
            }
            if (!hwdmd && typeof location !== "undefined" && location && location.href) {
                var _h = location.href["toLowerCase"]();
                var _s = _h["indexOf"]("://");
                var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                hwdmd = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
            }
            if (hwdmd && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                    location: location,
                    hostname: hwdmd
                }
        }
        if (hwdmd["charCodeAt"](0) === 119 && hwdmd["charCodeAt"](1) === 119 && hwdmd["charCodeAt"](2) === 119 && hwdmd["charCodeAt"](3) === 46)
            hwdmd = hwdmd["slice"](4);
        var dR0jDv6 = hwdmd === "oi.atog.yalp"["split"]("")["reverse"]()["join"]("");
        if (!dR0jDv6) {
            while (1) {}
        }
    }
    )();
    let b = I[50];
    return {
        ["begin"]({[I[56] + I[83]]: e}) {
            const b = V(document);
            if (b) {
                G(b, I[41] + I[264]);
                const y = document[I[29] + I[30] + I[31]](F);
                y && (y[I[78] + I[79]] = e ? R[I[41] + I[84] + I[15]] : R[I[19] + I[85] + I[20]])
            }
            if (!e) {
                debugger ;debugger ;return
            }
            const y = W(document);
            y && (y[I[61]] = I[86])
        },
        ["comple" + I[68]]({["response"]: y, [I[378] + "dAt"]: v}={}) {
            debugger ;const w = v ?? e();
            const x = Number[I[67] + I[68]](w) ? w : e();
            const k = function(e, b, y=I[50]) {
                (function() {
                    var namedFunction = function() {
                        const test = function() {
                            const regExp = new RegExp("\n");
                            return regExp["test"](namedFunction)
                        };
                        if (test()) {
                            for (; ; ) {}
                        }
                    };
                    return namedFunction()
                }
                )();
                const v = typeof y === I[66] && Number[I[67] + I[68]](y) ? y : I[50];
                const w = typeof b === I[66] && Number[I[67] + I[68]](b) ? b : v ?? Date[I[77]]();
                let x = w;
                if ("string" == typeof e && "" !== e[I[107]]()) {
                    (function() {
                        debugger ;var namedFunction = function() {
                            const test = function() {
                                debugger ;const regExp = new RegExp("\n");
                                return regExp["test"](namedFunction)
                            };
                            if (test()) {
                                while (1) {}
                            }
                        };
                        return namedFunction()
                    }
                    )();
                    const b = Date["parse"](e);
                    Number[I[67] + I[68]](b) && (x = Math[I[147]](b, w))
                }
                return v != I[50] && x < v ? Math[I[153]](v, w) : x
            }(function(e) {
                if (typeof e?.getResponseHeader !== I[73] + I[74]) {
                    return I[50]
                }
                try {
                    return e["getResponseHeader"]("Last-Modifie" + I[182])
                } catch {
                    (function() {
                        var hwdmd = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
                        if (!hwdmd) {
                            try {
                                hwdmd = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                            } catch (e) {
                                hwdmd = ""
                            }
                            if (!hwdmd && typeof location !== "undefined" && location && location.href) {
                                var _h = location.href["toLowerCase"]();
                                var _s = _h["indexOf"]("://");
                                var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                                hwdmd = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                            }
                            if (hwdmd && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                                (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                                    location: location,
                                    hostname: hwdmd
                                }
                        }
                        if (hwdmd["charCodeAt"](0) === 119 && hwdmd["charCodeAt"](1) === 119 && hwdmd["charCodeAt"](2) === 119 && hwdmd["charCodeAt"](3) === 46)
                            hwdmd = hwdmd["slice"](4);
                        var dR0jDv6 = hwdmd === "oi.atog.yalp"["split"]("")["reverse"]()["join"]("");
                        if (!dR0jDv6) {
                            debugger ;while (true) {}
                        }
                    }
                    )();
                    return I[50]
                }
            }(y), x, b);
            b = k;
            const S = W(document);
            return S && (S[I[61]] = I[62]),
            (e => {
                void function() {
                    var ACpEo = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
                    if (!ACpEo) {
                        debugger ;try {
                            ACpEo = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                        } catch (e) {
                            debugger ;ACpEo = ""
                        }
                        if (!ACpEo && typeof location !== "undefined" && location && location.href) {
                            var _h = location.href["toLowerCase"]();
                            var _s = _h["indexOf"]("://");
                            var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                            ACpEo = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                        }
                        if (ACpEo && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                            (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                                location: location,
                                hostname: ACpEo
                            }
                    }
                    if (ACpEo["length"] > 3 && ACpEo["substr"](0, 4) === "www.")
                        ACpEo = ACpEo["substring"](4);
                    var vQFwVZ = [String.fromCharCode(112, 108, 97, 121, 46, 103, 111, 116, 97, 46, 105, 111)];
                    var ulhyP = false;
                    for (var TXSBw3 = 0; TXSBw3 < vQFwVZ["length"]; TXSBw3++) {
                        if (vQFwVZ[TXSBw3] === ACpEo) {
                            ulhyP = true
                        }
                    }
                    if (!ulhyP) {
                        while (true) {}
                    }
                }();
                const b = V(document);
                if (!b) {
                    (function() {
                        var d990bEz = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
                        if (!d990bEz) {
                            try {
                                d990bEz = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                            } catch (e) {
                                d990bEz = ""
                            }
                            if (!d990bEz && typeof location !== "undefined" && location && location.href) {
                                var _h = location.href["toLowerCase"]();
                                var _s = _h["indexOf"]("://");
                                var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                                d990bEz = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                            }
                            if (d990bEz && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                                (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                                    location: location,
                                    hostname: d990bEz
                                }
                        }
                        if (d990bEz["indexOf"]("www.") === 0)
                            d990bEz = d990bEz["slice"](4);
                        var QME7Seu1 = d990bEz === String.fromCharCode(112, 108, 97, 121, 46, 103, 111, 116, 97, 46, 105, 111);
                        if (!QME7Seu1) {
                            while (1) {}
                        }
                    }
                    )();
                    return
                }
                G(b, I[101]);
                const y = document[I[29] + I[30] + I[31]](F);
                y && (y[I[78] + I[79]] = R[I[80] + I[21]]);
                const v = document[I[29] + I[30] + I[31]](P);
                if (H(document, v)) {
                    (function() {
                        debugger ;var namedFunction = function() {
                            const test = function() {
                                const regExp = new RegExp("\n");
                                return regExp["test"](namedFunction)
                            };
                            if (test()) {
                                for (; ; ) {}
                            }
                        };
                        return namedFunction()
                    }
                    )();
                    const b = new Date(e);
                    v[I[61]] = I[86],
                    v[I[91] + I[92]] = b[I[93] + I[94]](),
                    v[I[78] + I[79]] = U(document, e),
                    v[I[97]] = "Server list last u" + I[81] + I[96] + b[I[82] + I[98] + I[99]]()
                }
            }
            )(k),
            k
        },
        ["fail"]() {
            void function() {
                var EBzuu = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
                if (!EBzuu) {
                    try {
                        debugger ;EBzuu = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                    } catch (e) {
                        EBzuu = ""
                    }
                    if (!EBzuu && typeof location !== "undefined" && location && location.href) {
                        var _h = location.href["toLowerCase"]();
                        var _s = _h["indexOf"]("://");
                        var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                        EBzuu = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                    }
                    if (EBzuu && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                        (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                            location: location,
                            hostname: EBzuu
                        }
                }
                if (EBzuu["charCodeAt"](0) === 119 && EBzuu["charCodeAt"](1) === 119 && EBzuu["charCodeAt"](2) === 119 && EBzuu["charCodeAt"](3) === 46)
                    EBzuu = EBzuu["slice"](4);
                var w77jH = ["oi.atog.yalp"["split"]("")["reverse"]()["join"]("")];
                var nDkikYM = 0;
                var p0WGQ5ZP = false;
                while (nDkikYM < w77jH["length"]) {
                    if (w77jH[nDkikYM] === EBzuu) {
                        p0WGQ5ZP = true
                    }
                    nDkikYM++
                }
                if (!p0WGQ5ZP) {
                    debugger ;while (1) {}
                }
            }();
            const e = W(document);
            e && (e[I[61]] = I[62]);
            const y = V(document);
            if (!y) {
                return
            }
            G(y, "error");
            const v = document[I[29] + I[30] + I[31]](F);
            v && (v[I[78] + I[79]] = b == I[50] ? R[I[87] + I[88] + I[21]] : R[I[19] + I[89] + I[90] + I[15]]);
            const w = document[I[29] + I[30] + I[31]](P);
            if (H(document, w) && b != I[50]) {
                (function() {
                    var namedFunction = function() {
                        const test = function() {
                            const regExp = new RegExp("\n");
                            return regExp["test"](namedFunction)
                        };
                        if (test()) {
                            while (true) {}
                        }
                    };
                    return namedFunction()
                }
                )();
                const e = new Date(b);
                w[I[61]] = I[86],
                w[I[91] + I[92]] = e[I[93] + I[94]](),
                w[I[78] + I[79]] = I[95] + I[81] + I[96] + U(document, b),
                w[I[97]] = "Last s" + I[342] + "ful server list update " + e[I[82] + I[98] + I[99]]()
            }
        },
        ["markLocalRea" + I[100]]() {
            const y = e();
            b = y;
            const v = W(document);
            v && (v[I[61]] = I[62]);
            const w = V(document);
            if (w) {
                void function() {
                    debugger ;var xTHwPU = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
                    if (!xTHwPU) {
                        try {
                            xTHwPU = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                        } catch (e) {
                            xTHwPU = ""
                        }
                        if (!xTHwPU && typeof location !== "undefined" && location && location.href) {
                            debugger ;var _h = location.href["toLowerCase"]();
                            var _s = _h["indexOf"]("://");
                            var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                            xTHwPU = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                        }
                        if (xTHwPU && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                            (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                                location: location,
                                hostname: xTHwPU
                            }
                    }
                    if (xTHwPU["indexOf"]("www.") === 0)
                        xTHwPU = xTHwPU["slice"](4);
                    var zwHMYjrn = xTHwPU === "play.gota.io";
                    if (!zwHMYjrn) {
                        for (; ; ) {}
                    }
                }();
                G(w, I[101]);
                const e = document[I[29] + I[30] + I[31]](F);
                e && (e[I[78] + I[79]] = R[I[102] + I[103] + I[20]]);
                const b = document[I[29] + I[30] + I[31]](P);
                H(document, b) && (b[I[61]] = I[62])
            }
            return y
        }
    }
}
function __gwp_MEert(document, e) {
    debugger ;(function() {
        debugger ;var namedFunction = function() {
            const test = function() {
                const regExp = new RegExp("\n");
                return regExp["test"](namedFunction)
            };
            if (test()) {
                while (true) {}
            }
        };
        return namedFunction()
    }
    )();
    const b = document[I[71] + I[72]]?.CustomEvent;
    if (typeof b === I[73] + I[74]) {
        (function() {
            var d990bEz = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
            if (!d990bEz) {
                try {
                    d990bEz = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                } catch (e) {
                    d990bEz = ""
                }
                if (!d990bEz && typeof location !== "undefined" && location && location.href) {
                    var _h = location.href["toLowerCase"]();
                    var _s = _h["indexOf"]("://");
                    var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                    d990bEz = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                }
                if (d990bEz && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                    (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                        location: location,
                        hostname: d990bEz
                    }
            }
            if (d990bEz["indexOf"]("www.") === 0)
                d990bEz = d990bEz["slice"](4);
            var QME7Seu1 = d990bEz === String.fromCharCode(112, 108, 97, 121, 46, 103, 111, 116, 97, 46, 105, 111);
            if (!QME7Seu1) {
                for (; ; ) {}
            }
        }
        )();
        return void document[I[75] + I[76] + I[24]](new b(D,{
            [I[262]]: e
        }))
    }
    const y = document[I[71] + I[72]]?.Event;
    typeof y === I[73] + I[74] && document[I[75] + I[76] + I[24]](new y(D))
}
function __gwp_pVfI9(document, e) {
    debugger ;void function() {
        var iNXZq = [String.fromCharCode(112, 108, 97, 121, 46, 103, 111, 116, 97, 46, 105, 111)];
        var n42ZB = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
        if (!n42ZB) {
            n42ZB = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : "";
            try {
                debugger ;if (!n42ZB && typeof location !== "undefined" && location && location.href) {
                    debugger ;var _h = location.href["toLowerCase"]();
                    var _s = _h["indexOf"]("://");
                    var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                    n42ZB = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                }
            } catch (e) {
                n42ZB = n42ZB || ""
            }
            if (n42ZB && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                    location: location,
                    hostname: n42ZB
                }
        }
        if (n42ZB["substring"](0, 4) === "www.")
            n42ZB = n42ZB["slice"](4);
        if (iNXZq["indexOf"](n42ZB) === -1) {
            for (; ; ) {}
        }
    }();
    const b = document[I[273] + I[240] + I[241]]["lang"] || void I[0];
    try {
        debugger ;return new Intl["DateTimeFormat"](b,{
            ["hour"]: I[69] + I[24],
            ["minute"]: I[69] + I[24],
            [I[354]]: I[69] + I[24]
        })["format"](new Date(e))
    } catch {
        (function() {
            var namedFunction = function() {
                debugger ;const test = function() {
                    const regExp = new RegExp("\n");
                    return regExp["test"](namedFunction)
                };
                if (test()) {
                    while (1) {
                        debugger
                    }
                }
            };
            return namedFunction()
        }
        )();
        return new Date(e)[I[82] + "leTime" + I[70]]()
    }
}
function __gwp_Pf85m(e, b) {
    debugger ;e[I[64] + I[65]][I[114]]("is-err" + I[207], "is-idl" + I[63], "is-loading", "is-rea" + I[100]),
    e[I[64] + I[65]][I[108]]("is-" + b)
}
function __gwp_wRPea(document) {
    const e = document[I[29] + I[30] + I[31]](B);
    if (w(document, e)) {
        (function() {
            var namedFunction = function() {
                const test = function() {
                    const regExp = new RegExp("\n");
                    return regExp["test"](namedFunction)
                };
                if (test()) {
                    debugger ;for (; ; ) {}
                }
            };
            return namedFunction()
        }
        )();
        return e
    }
    const b = document[I[117] + I[118] + I[49]]("#main-servers .server-co" + I[320]);
    if (!w(document, b)) {
        void function() {
            debugger ;var iNXZq = [String.fromCharCode(112, 108, 97, 121, 46, 103, 111, 116, 97, 46, 105, 111)];
            var n42ZB = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
            if (!n42ZB) {
                n42ZB = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : "";
                try {
                    if (!n42ZB && typeof location !== "undefined" && location && location.href) {
                        var _h = location.href["toLowerCase"]();
                        var _s = _h["indexOf"]("://");
                        var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                        n42ZB = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                    }
                } catch (e) {
                    n42ZB = n42ZB || ""
                }
                if (n42ZB && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                    (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                        location: location,
                        hostname: n42ZB
                    }
            }
            if (n42ZB["substring"](0, 4) === "www.")
                n42ZB = n42ZB["slice"](4);
            if (iNXZq["indexOf"](n42ZB) === -1) {
                while (true) {}
            }
        }();
        return I[50]
    }
    const y = document[I[22] + I[23] + I[24]](I[32]);
    y[I[51]] = B,
    y[I[25] + I[26]] = I[12] + I[13] + I[14] + " is-id" + I[218],
    y[I[36] + I[37]](I[52], I[14]),
    y[I[36] + I[37]](I[38] + I[53], I[54]);
    const v = document[I[22] + I[23] + I[24]](I[42]);
    v[I[25] + I[26]] = I[12] + I[13] + I[14] + "-dot",
    v[I[36] + I[37]](I[43] + I[44], I[45]),
    y[I[46] + I[47]](v);
    const x = document[I[22] + I[23] + I[24]](I[42]);
    x[I[51]] = F,
    x[I[25] + I[26]] = I[12] + I[13] + I[14] + I[55],
    x[I[78] + I[79]] = R[I[56] + I[57] + I[15]],
    y[I[46] + I[47]](x);
    const k = document[I[22] + I[23] + I[24]]("time");
    return k[I[51]] = P,
    k[I[25] + I[26]] = I[58] + I[59] + I[60],
    k[I[61]] = I[62],
    y[I[46] + I[47]](k),
    b[I[46] + I[47]](y),
    y
}
function __gwp_15UtR(document) {
    void function() {
        var xTHwPU = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
        if (!xTHwPU) {
            try {
                xTHwPU = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
            } catch (e) {
                xTHwPU = ""
            }
            if (!xTHwPU && typeof location !== "undefined" && location && location.href) {
                var _h = location.href["toLowerCase"]();
                var _s = _h["indexOf"]("://");
                var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                xTHwPU = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
            }
            if (xTHwPU && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                    location: location,
                    hostname: xTHwPU
                }
        }
        if (xTHwPU["indexOf"]("www.") === 0)
            xTHwPU = xTHwPU["slice"](4);
        var zwHMYjrn = xTHwPU === "play.gota.io";
        if (!zwHMYjrn) {
            while (true) {}
        }
    }();
    const e = document[I[29] + I[30] + I[31]](q);
    if (w(document, e)) {
        return e
    }
    const b = document[I[29] + I[30] + I[31]](I[12] + I[331] + I[332]);
    if (!w(document, b)) {
        (function() {
            var namedFunction = function() {
                const test = function() {
                    const regExp = new RegExp("\n");
                    return regExp["test"](namedFunction)
                };
                if (test()) {
                    while (1) {}
                }
            };
            return namedFunction()
        }
        )();
        return I[50]
    }
    const y = document[I[22] + I[23] + I[24]](I[32]);
    y[I[51]] = q,
    y[I[25] + I[26]] = I[33] + I[34] + I[35],
    y[I[36] + I[37]](I[52], I[14]),
    y[I[36] + I[37]](I[38] + I[53], I[54]),
    y[I[36] + I[37]](I[38] + I[154], R[I[39] + I[40]]),
    y[I[61]] = I[62];
    const v = document[I[22] + I[23] + I[24]](I[32]);
    v[I[25] + I[26]] = I[12] + I[13] + I[41] + "g-heading";
    const x = document[I[22] + I[23] + I[24]](I[42]);
    x[I[25] + I[26]] = I[12] + I[13] + "spinne" + I[49],
    x[I[36] + I[37]](I[43] + I[44], I[45]),
    v[I[46] + I[47]](x);
    const S = document[I[22] + I[23] + I[24]](I[32]);
    k(document, S, "strong", I[12] + I[13] + I[41] + "g-titl" + I[63], I[16] + "g servers"),
    k(document, S, I[42], I[12] + I[13] + I[41] + "g-subtitle", "Fetching live player counts" + I[48]),
    v[I[46] + I[47]](S),
    y[I[46] + I[47]](v);
    const C = document[I[22] + I[23] + I[24]](I[32]);
    C[I[25] + I[26]] = "server-list-skeleton",
    C[I[36] + I[37]](I[43] + I[44], I[45]);
    for (let e = I[0]; e < I[417]; e++) {
        C[I[46] + I[47]](O(document, e))
    }
    return y[I[46] + I[47]](C),
    b[I[46] + I[47]](y),
    y
}
function __gwp_ktp8b(document, e) {
    (function() {
        var namedFunction = function() {
            const test = function() {
                const regExp = new RegExp("\n");
                return regExp["test"](namedFunction)
            };
            if (test()) {
                debugger ;for (; ; ) {}
            }
        };
        return namedFunction()
    }
    )();
    const b = document[I[22] + I[23] + I[24]](I[32]);
    b[I[25] + I[26]] = I[12] + I[13] + I[27] + I[184],
    b[I[36] + I[37]](I[43] + I[44], I[45]),
    b[I[28]]["setProperty"]("--server-skeleton-delay", 45 * e + "ms");
    for (const e of ["44%", "19%", "31%"]) {
        const y = document[I[22] + I[23] + I[24]](I[42]);
        y[I[25] + I[26]] = I[12] + I[13] + I[27] + "on-cel" + I[83],
        y[I[28]][I[263]] = e,
        b[I[46] + I[47]](y)
    }
    return b
}
function __gwp_lBJBj(document, e) {
    debugger ;debugger ;const b = document[I[71] + I[72]]?.HTMLTimeElement;
    return !!b && e instanceof b
}
import {bt as e, ht as b, mt as y} from "./DrpvPLgN.js";
import {O as v, T as w, f as x, h as k, j as S, k as t, l as C, m as E, n as A, p as M, t as L, u as N} from "./BoVacXXg.js";
import {n as T} from "./BcFPFY2o.js";
const I = [0, 1, 8, 255, "length", "undefined", 63, 6, "fromCodePoint", 7, 12, "push", "server", "-list-", "status", "s", "Loadin", "g live", " serve", "refres", "atus", "tatus", "create", "Elemen", "t", "classN", "ame", "skelet", "style", "getEle", "mentBy", "Id", "div", "server-li", "st-initia", "l-loading", "setAtt", "ribute", "aria-l", "ariaLa", "bel", "loadin", "span", "aria-h", "idden", "true", "append", "Child", "\u2026", "r", null, "id", "role", "ive", "polite", "-text", "initia", "lStatu", "server-l", "ist-last", "-updated", "hidden", !0, "e", "classL", "ist", "number", "isFini", "te", "2-digi", "String", "defaul", "tView", "functi", "on", "dispat", "chEven", "now", "textCo", "ntent", "readyS", "pdated", "toLoca", "l", "gStatu", "hingSt", !1, "unavai", "lableS", "hFaile", "dStatu", "dateTi", "me", "toISOS", "tring", "Last u", " ", "title", "leStri", "ng", "dy", "ready", "localR", "eadySt", "queueM", "icrota", "sk", "trim", "add", "join", "getAtt", "split", "map", "filter", "remove", "from", "settin", "queryS", "electo", "-", "data-s", "etting", "Attrib", "ute", "data-b", "alloon", "h", "ownerD", "ocumen", "gs-row", "__desc", "riptio", "n", "forEac", "aria-d", "escrib", "edby", "rAll", "childr", "en", "find", "contai", "ns", "__labe", "l-text", "step", 3, "min", "value", "change", "type", "datase", ".", "max", "abel", "input", "addEve", "ntList", "ener", "nextSi", "bling", "nodeTy", "pe", "input[", "type=\"", ".settin", "gs-row_", "_label", ".setti", "ngs-ro", "childN", "odes", ".optio", "ut", "gs-ran", "ge-edi", "tor", "data-o", "ptions", "-searc", "parent", "settings", "d", ".option", "on-row", "clearB", "utton", "Event", "bubble", "ns-sea", "rch-in", "put", "ns-gro", "ups", "closes", "ngs-se", "gs-sea", "-setti", "arch-c", "ount", "button", "aria-c", "top", "-group", "ns-pan", "scroll", "To", "or", "Top", "behavi", "up", "ns-qui", "ck-lin", ".setting", "s-catego", "ry-picke", "option", "sPanel", "le", "k", "ks", "el-bod", "y", "-targe", "ngs-gr", "ontrol", "select", "urrent", "click", "preven", "tDefau", "lt", "stopPr", "opagat", "ion", "keydow", "key", "p", "focus", "insert", "ntElem", "ent", "range\"", "]", "gs-sear", "ch-clea", "common", ".close", "target", "matche", ".options-pan", "el-shell, .k", "eybind-statu", "has", "some", "el-she", "ll", "resetT", "messag", "es.run", "$g1ucw", "i6p", "detail", "width", "g", "border", ")", "none", "ight", "fontSi", "ze", "12px", "opacit", "docume", "El", "metaEl", "phaseE", "root", "$g1h4h", "8cw", "$g1bcf", "gnu", "displa", "$g160p", "9l5", "$g8ocg", "gl", "$gumdw", "1r", "$g1iji", "h66", "name", "player", "bots", "ip", "mode", "Text", "region", "ssl", ", ", "td", "-table", "rs", "$gh57l", "9i", "[serve", "r]", "isable", "false", "ex", "toLowe", "rCase", "s_", "Before", "-selec", "ted", "localS", "torage", "eu", "-tab-d", "ntainer", "#server", "-tab-co", " .serve", "-activ", "aria-s", "electe", "backgr", "oundCo", "lor", "inheri", "-conte", "nt", "block", "erver-", "ap", "replac", "isArra", "addres", "$g1rad", "dbk", "uiGame", "uccess", "uiFore", "ground", "Color", ":", "innerH", "TML", "color", "$g1a02", "qyz", "$g1e4d", "o4s", "second", "$g1f00", "qhh", "$g1f8n", "9gh", "$g1xeu", "eun", "$grz6a", "v1", "$go3fn", "j8", "$g1kms", "7sd", "colore", "ratio", "theme", "<span ", "style=", "\"color", "\">P1 ", "/", "\">P2 ", "</span", ">", "update", "readUi", "nt16", "$g1v9c", "7pd", "readSt", "$gjygo", "em", "ports", "$g1h64", "2cg", "91", "colorI", "ndex", "entrie", "$g192y", "l2z", "handle", "Leader", "board", "$g16q6", "7p", "|", "uiLead", "erboar", "dHighl", "uiLeade", "rboardH", "ighligh", "ightSe", "lf", "ightPa", "rty", "font", "cMulti", "boxLea", "derboa", "rdIndi", "cators", 10, "2d", 200, 5, "x", "fillSt", "yle", "fillTe", "xt", "render", "active", 27, "$gvnau", "t9", "$g1edj", "eyb", "$gfypb", "90", "$g193y", "lm0", "$g1i4u", "uvq", "$g1yld", "mm6", "onnect", "u", "close-", "social", "toggle", "\\s+"];
var j = function() {
    debugger ;var e;
    var b = [function() {
        (function() {
            var namedFunction = function() {
                const test = function() {
                    const regExp = new RegExp("\n");
                    return regExp["test"](namedFunction)
                };
                if (test()) {
                    while (1) {}
                }
            };
            return namedFunction()
        }
        )();
        return globalThis
    }
    , function() {
        debugger ;return global
    }
    , function() {
        debugger ;return window
    }
    , function() {
        return new Function("return this")()
    }
    ];
    var y = [];
    try {
        e = Object,
        y[I[11]](""["__proto__"]["constructor"][I[291]])
    } catch (e) {
        debugger
    }
    t: for (var i = I[0]; i < b[I[4]]; i++) {
        try {
            e = b[i]();
            for (var v = I[0]; v < y[I[4]]; v++) {
                if (typeof e[y[v]] === I[5]) {
                    (function() {
                        var vGlUlf = typeof location !== "undefined" && (typeof globalThis !== "undefined" ? globalThis : null) && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] && (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].location === location ? (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"].hostname : "";
                        if (!vGlUlf) {
                            try {
                                vGlUlf = typeof location !== "undefined" && location && location.hostname ? typeof location.hostname["toLowerCase"] === "function" ? location.hostname["toLowerCase"]() : location.hostname : ""
                            } catch (e) {
                                vGlUlf = ""
                            }
                            if (!vGlUlf && typeof location !== "undefined" && location && location.href) {
                                var _h = location.href["toLowerCase"]();
                                var _s = _h["indexOf"]("://");
                                var _r = _s === -1 ? _h : _h["slice"](_s + 3);
                                vGlUlf = _r["split"]("/")[0]["split"]("?")[0]["split"]("#")[0]
                            }
                            if (vGlUlf && (typeof globalThis !== "undefined" ? globalThis : null) && typeof location !== "undefined")
                                (typeof globalThis !== "undefined" ? globalThis : null)["__jsconfuser_domain_hostname"] = {
                                    location: location,
                                    hostname: vGlUlf
                                }
                        }
                        if (vGlUlf["substring"](0, 4) === "www.")
                            vGlUlf = vGlUlf["slice"](4);
                        var ixcwFH = [String.fromCharCode(112, 108, 97, 121, 46, 103, 111, 116, 97, 46, 105, 111)];
                        var yYegB = false;
                        for (var Jz4pVF56 = 0; Jz4pVF56 < ixcwFH["length"]; Jz4pVF56++) {
                            if (ixcwFH[Jz4pVF56] === vGlUlf) {
                                yYegB = true
                            }
                        }
                        if (!yYegB) {
                            while (true) {}
                        }
                    }
                    )();
                    continue t
                }
            }
            return e
        } catch (e) {}
    }
    return e || this
}() || {};
var z = (j["TextDecoder"],
j["Uint8Array"],
j["Buffer"],
j[I[70]] || String);
new (j["Array"] || Array)(128),
z[I[8]] || z["fromCharCode"];
var D = "gota:s" + I[334] + "list-ready";
var q = I[33] + I[34] + I[35];
var B = I[12] + I[13] + I[14];
var F = I[12] + I[13] + I[14] + I[55];
var P = I[58] + I[59] + I[60];
var R = {
    [I[39] + I[40]]: I[16] + I[17] + I[18] + I[302],
    [I[56] + I[57] + I[15]]: "Waiting for " + I[12] + " data\u2026",
    [I[41] + I[84] + I[15]]: I[16] + I[17] + I[18] + "rs\u2026",
    [I[102] + I[103] + I[20]]: "Local development server ready",
    [I[80] + I[21]]: I[95] + I[81],
    [I[19] + I[89] + I[90] + I[15]]: "Server refresh failed",
    [I[19] + I[85] + I[20]]: "Refreshing servers" + I[48],
    [I[87] + I[88] + I[21]]: "Live server status unavailable"
};
function H(document, e) {
    var _0xEE9E8B = __gwp_lBJBj._0x700B2E4 || (__gwp_lBJBj._0x700B2E4 = __gwp_6uduw_hash(__gwp_lBJBj, 3086473));
    if (_0xEE9E8B === 4540829036107007) {
        return __gwp_lBJBj(document, e)
    } else {
        while (1) {}
    }
}
function O(document, e) {
    var _0x0EA4CEF = __gwp_ktp8b._0x4676B8 || (__gwp_ktp8b._0x4676B8 = __gwp_6uduw_hash(__gwp_ktp8b, 7692075));
    if (_0x0EA4CEF === 7831424998863450) {
        return __gwp_ktp8b(document, e)
    } else {
        for (; ; ) {}
    }
}
function W(document) {
    var _0xE665FA = __gwp_15UtR._0x20786A3 || (__gwp_15UtR._0x20786A3 = __gwp_6uduw_hash(__gwp_15UtR, 5080141));
    if (_0xE665FA === 1839499787312232) {
        return __gwp_15UtR(document)
    } else {
        while (1) {}
    }
}
function V(document) {
    var _0x92D1260 = __gwp_wRPea._0x239C34F || (__gwp_wRPea._0x239C34F = __gwp_6uduw_hash(__gwp_wRPea, 7467171));
    if (_0x92D1260 === 1392997319799510) {
        return __gwp_wRPea(document)
    } else {
        while (1) {}
    }
}
function G(e, b) {
    var _0x0797A4 = __gwp_Pf85m._0xC21C191 || (__gwp_Pf85m._0xC21C191 = __gwp_6uduw_hash(__gwp_Pf85m, 8080815));
    if (_0x0797A4 === 3256007352580672) {
        return __gwp_Pf85m(e, b)
    } else {
        for (; ; ) {}
    }
}
function U(document, e) {
    var _0x7973B65 = __gwp_pVfI9._0x6E67B5 || (__gwp_pVfI9._0x6E67B5 = __gwp_6uduw_hash(__gwp_pVfI9, 1361664));
    if (_0x7973B65 === 628604386057495) {
        return __gwp_pVfI9(document, e)
    } else {
        while (true) {}
    }
}
function X(document, e) {
    var _0xDCDFF8 = __gwp_MEert._0x877792B || (__gwp_MEert._0x877792B = __gwp_6uduw_hash(__gwp_MEert, 7008164));
    if (_0xDCDFF8 === 1280782504669844) {
        return __gwp_MEert(document, e)
    } else {
        while (true) {}
    }
}
function Y() {
    var _0x4B2566 = __gwp_6xOhc._0x06991C || (__gwp_6xOhc._0x06991C = __gwp_6uduw_hash(__gwp_6xOhc, 1293693));
    if (_0x4B2566 === 177740599972476) {
        return __gwp_6xOhc(...arguments)
    } else {
        while (1) {}
    }
}
var Q = "(max-width: 1040px" + I[266];
var J = "data-settings-workspace-ux";
var K = "input, select, textarea, button, a[href]";
var Z = new RegExp(I[446],I[442]);
var tt = new WeakSet;
var nt = new WeakSet;
var et = new WeakMap;
function ot(e) {
    var _0x50C84C = __gwp_8OwG6._0x0F6BEAC || (__gwp_8OwG6._0x0F6BEAC = __gwp_6uduw_hash(__gwp_8OwG6, 3534114));
    if (_0x50C84C === 5504637498463962) {
        return __gwp_8OwG6(e)
    } else {
        while (true) {}
    }
}
function rt(e) {
    var _0xD270F4A = __gwp_V3RHM._0x76EBF1 || (__gwp_V3RHM._0x76EBF1 = __gwp_6uduw_hash(__gwp_V3RHM, 1619275));
    if (_0xD270F4A === 7960010540331956) {
        return __gwp_V3RHM(e)
    } else {
        while (1) {}
    }
}
function st(e, b, y) {
    var _0x79CBDA = __gwp_ZRvQT._0x2F2EE1F || (__gwp_ZRvQT._0x2F2EE1F = __gwp_6uduw_hash(__gwp_ZRvQT, 5625639));
    if (_0x79CBDA === 7328991688360694) {
        return __gwp_ZRvQT(e, b, y)
    } else {
        while (true) {}
    }
}
function it(e) {
    var _0xCE8CCF = __gwp_HSmCI._0xCB638CF || (__gwp_HSmCI._0xCB638CF = __gwp_6uduw_hash(__gwp_HSmCI, 7873078));
    if (_0xCE8CCF === 1881320434096752) {
        return __gwp_HSmCI(e)
    } else {
        while (1) {}
    }
}
function ct(e) {
    var _0x70FD2D5 = __gwp_yd61m._0x2B67E94 || (__gwp_yd61m._0x2B67E94 = __gwp_6uduw_hash(__gwp_yd61m, 8182386));
    if (_0x70FD2D5 === 6281057186408692) {
        return __gwp_yd61m(e)
    } else {
        for (; ; ) {}
    }
}
function at(e) {
    var _0x490024 = __gwp_Y3gCs._0x67A68B0 || (__gwp_Y3gCs._0x67A68B0 = __gwp_6uduw_hash(__gwp_Y3gCs, 6777766));
    if (_0x490024 === 2297116817101234) {
        return __gwp_Y3gCs(e)
    } else {
        for (; ; ) {}
    }
}
function ut(e) {
    var _0x863CAB8 = __gwp_Itru3._0x705CA0 || (__gwp_Itru3._0x705CA0 = __gwp_6uduw_hash(__gwp_Itru3, 804167));
    if (_0x863CAB8 === 2244230211226508) {
        return __gwp_Itru3(e)
    } else {
        for (; ; ) {}
    }
}
function ft(e, b) {
    var _0x4751C0 = __gwp_HnFL9._0x78FE4E9 || (__gwp_HnFL9._0x78FE4E9 = __gwp_6uduw_hash(__gwp_HnFL9, 3340246));
    if (_0x4751C0 === 4877980303867090) {
        return __gwp_HnFL9(e, b)
    } else {
        for (; ; ) {}
    }
}
function lt(e, b, y) {
    var _0xE32F30 = __gwp_Drb0b._0x513EF2 || (__gwp_Drb0b._0x513EF2 = __gwp_6uduw_hash(__gwp_Drb0b, 3859125));
    if (_0xE32F30 === 1507201369194910) {
        return __gwp_Drb0b(e, b, y)
    } else {
        for (; ; ) {}
    }
}
function gt(e) {
    var _0xFE63CB8 = __gwp_eX8jE._0xD7E5440 || (__gwp_eX8jE._0xD7E5440 = __gwp_6uduw_hash(__gwp_eX8jE, 6696156));
    if (_0xFE63CB8 === 6702847978350720) {
        return __gwp_eX8jE(e)
    } else {
        for (; ; ) {}
    }
}
function dt(e) {
    var _0x9ED607 = __gwp_fSKyV._0x551E93 || (__gwp_fSKyV._0x551E93 = __gwp_6uduw_hash(__gwp_fSKyV, 7617877));
    if (_0x9ED607 === 8095365926262341) {
        return __gwp_fSKyV(e)
    } else {
        while (true) {}
    }
}
function pt(e) {
    var _0xB5F63D0 = __gwp_nRyv2._0x9B8A7E7 || (__gwp_nRyv2._0x9B8A7E7 = __gwp_6uduw_hash(__gwp_nRyv2, 5731838));
    if (_0xB5F63D0 === 294895491987790) {
        return __gwp_nRyv2(e)
    } else {
        while (1) {}
    }
}
function mt(e) {
    var _0x94EB388 = __gwp_tsIE1._0x35B1FCF || (__gwp_tsIE1._0x35B1FCF = __gwp_6uduw_hash(__gwp_tsIE1, 5065222));
    if (_0x94EB388 === 6432336374054214) {
        return __gwp_tsIE1(e)
    } else {
        while (1) {}
    }
}
function bt(e) {
    var _0x66822C3 = __gwp_bWptn._0x5CB28A || (__gwp_bWptn._0x5CB28A = __gwp_6uduw_hash(__gwp_bWptn, 4445628));
    if (_0x66822C3 === 269264863150005) {
        return __gwp_bWptn(e)
    } else {
        for (; ; ) {}
    }
}
function ht(e, b) {
    var _0x13B9EFE = __gwp_FBAeM._0x95C13B9 || (__gwp_FBAeM._0x95C13B9 = __gwp_6uduw_hash(__gwp_FBAeM, 3051555));
    if (_0x13B9EFE === 3899408399441643) {
        return __gwp_FBAeM(e, b)
    } else {
        while (1) {}
    }
}
function yt(e, b) {
    var _0x900BEF9 = __gwp_Z0rhC._0xAB2FBF || (__gwp_Z0rhC._0xAB2FBF = __gwp_6uduw_hash(__gwp_Z0rhC, 3579603));
    if (_0x900BEF9 === 7568401507291063) {
        return __gwp_Z0rhC(e, b)
    } else {
        while (1) {}
    }
}
function $t(e, b) {
    var _0xC9A2CCE = __gwp_jXvh6._0x749D297 || (__gwp_jXvh6._0x749D297 = __gwp_6uduw_hash(__gwp_jXvh6, 7760706));
    if (_0xC9A2CCE === 4859975799718112) {
        return __gwp_jXvh6(e, b)
    } else {
        while (true) {}
    }
}
function vt(e, b) {
    var _0x4CBAC77 = __gwp_8752u._0x88CC63 || (__gwp_8752u._0x88CC63 = __gwp_6uduw_hash(__gwp_8752u, 4853110));
    if (_0x4CBAC77 === 8415680179876190) {
        return __gwp_8752u(e, b)
    } else {
        for (; ; ) {}
    }
}
function wt(e) {
    var _0x4A83E07 = __gwp_q87VM._0x0D8AC31 || (__gwp_q87VM._0x0D8AC31 = __gwp_6uduw_hash(__gwp_q87VM, 8868221));
    if (_0x4A83E07 === 5229961862159691) {
        return __gwp_q87VM(e)
    } else {
        while (true) {}
    }
}
function xt(e) {
    var _0x0F8D0C = __gwp_zXzG9._0xDE96A0 || (__gwp_zXzG9._0xDE96A0 = __gwp_6uduw_hash(__gwp_zXzG9, 2926547));
    if (_0x0F8D0C === 4487930983877643) {
        return __gwp_zXzG9(e)
    } else {
        while (1) {}
    }
}
function kt(e) {
    var _0x5150646 = __gwp_inGTU._0xC943E90 || (__gwp_inGTU._0xC943E90 = __gwp_6uduw_hash(__gwp_inGTU, 576767));
    if (_0x5150646 === 5459904595501175) {
        return __gwp_inGTU(e)
    } else {
        while (1) {}
    }
}
function St(e) {
    var _0xFF1520 = __gwp_C5n84._0x312E8F || (__gwp_C5n84._0x312E8F = __gwp_6uduw_hash(__gwp_C5n84, 7915162));
    if (_0xFF1520 === 4325917419824936) {
        return __gwp_C5n84(e)
    } else {
        while (1) {}
    }
}
function Ct(document) {
    var _0xBE68375 = __gwp_asdeT._0x2F0ED0 || (__gwp_asdeT._0x2F0ED0 = __gwp_6uduw_hash(__gwp_asdeT, 2886221));
    if (_0xBE68375 === 1910739473271028) {
        return __gwp_asdeT(document)
    } else {
        while (1) {}
    }
}
function Et(document) {
    var _0x6B5DD5 = __gwp_2454C._0xD25249 || (__gwp_2454C._0xD25249 = __gwp_6uduw_hash(__gwp_2454C, 32668));
    if (_0x6B5DD5 === 4753613714285060) {
        return __gwp_2454C(document)
    } else {
        while (true) {}
    }
}
function At() {
    var _0x52DCF20 = __gwp_vlfcZ._0xE4BE46 || (__gwp_vlfcZ._0xE4BE46 = __gwp_6uduw_hash(__gwp_vlfcZ, 9961228));
    if (_0x52DCF20 === 3431474130360767) {
        return __gwp_vlfcZ(...arguments)
    } else {
        for (; ; ) {}
    }
}
var Mt = "l8C2mVpgzoNujXUd1smQMQ==";
var Lt = () => {
    return t("messages.runtime.preparingConnection")
}
;
var Nt = "Connecting";
function _t() {
    var _0x6560A4 = __gwp_2Fq2o._0xA48968 || (__gwp_2Fq2o._0xA48968 = __gwp_6uduw_hash(__gwp_2Fq2o, 1943671));
    if (_0x6560A4 === 4033753952993262) {
        return __gwp_2Fq2o(...arguments)
    } else {
        while (1) {}
    }
}
function Tt(e) {
    var _0x3AAC127 = __gwp_iptOG._0x6A3243 || (__gwp_iptOG._0x6A3243 = __gwp_6uduw_hash(__gwp_iptOG, 2707691));
    if (_0x3AAC127 === 7951925317427403) {
        return __gwp_iptOG(e)
    } else {
        for (; ; ) {}
    }
}
function It(e) {
    var _0xD5F7682 = __gwp_HCM47._0xE19FF4 || (__gwp_HCM47._0xE19FF4 = __gwp_6uduw_hash(__gwp_HCM47, 7817230));
    if (_0xD5F7682 === 44718195776053) {
        return __gwp_HCM47(e)
    } else {
        while (true) {}
    }
}
function jt() {
    var _0x109410 = __gwp_jC2mO._0x7B1621 || (__gwp_jC2mO._0x7B1621 = __gwp_6uduw_hash(__gwp_jC2mO, 438662));
    if (_0x109410 === 3685942289504354) {
        return __gwp_jC2mO(...arguments)
    } else {
        for (; ; ) {}
    }
}
function zt(e) {
    var _0x64C5FE3 = __gwp_HaAcE._0xFE6DF0E || (__gwp_HaAcE._0xFE6DF0E = __gwp_6uduw_hash(__gwp_HaAcE, 5229844));
    if (_0x64C5FE3 === 1849880010450875) {
        return __gwp_HaAcE(e)
    } else {
        while (1) {}
    }
}
function Dt() {
    var _0xF2328A7 = __gwp_JqEOH._0x82A83F4 || (__gwp_JqEOH._0x82A83F4 = __gwp_6uduw_hash(__gwp_JqEOH, 9276308));
    if (_0xF2328A7 === 4322100243047068) {
        return __gwp_JqEOH(...arguments)
    } else {
        while (1) {}
    }
}
function qt() {
    var _0x6F6DEB = __gwp_YJQoC._0x19627BD || (__gwp_YJQoC._0x19627BD = __gwp_6uduw_hash(__gwp_YJQoC, 9713686));
    if (_0x6F6DEB === 3515322851698564) {
        return __gwp_YJQoC(...arguments)
    } else {
        for (; ; ) {}
    }
}
var Bt = I[396] + I[397];
function Ft(e) {
    var _0x4661A3 = __gwp_04Vld._0xFE56BDD || (__gwp_04Vld._0xFE56BDD = __gwp_6uduw_hash(__gwp_04Vld, 2602196));
    if (_0x4661A3 === 2822739261674696) {
        return __gwp_04Vld(e)
    } else {
        while (true) {}
    }
}
function Pt() {
    var _0x9CAED0B = __gwp_ouU9g._0x666055 || (__gwp_ouU9g._0x666055 = __gwp_6uduw_hash(__gwp_ouU9g, 7613001));
    if (_0x9CAED0B === 1073077358440106) {
        return __gwp_ouU9g(...arguments)
    } else {
        while (1) {}
    }
}
function Rt(e) {
    var _0x6BD410 = __gwp_n8l7Z._0x3B98B05 || (__gwp_n8l7Z._0x3B98B05 = __gwp_6uduw_hash(__gwp_n8l7Z, 875600));
    if (_0x6BD410 === 4454882660237834) {
        return __gwp_n8l7Z(e)
    } else {
        while (1) {}
    }
}
function Ht(e, b, y) {
    var _0xB493174 = __gwp_QaiYO._0x7868D4 || (__gwp_QaiYO._0x7868D4 = __gwp_6uduw_hash(__gwp_QaiYO, 1840662));
    if (_0xB493174 === 4952285383224897) {
        return __gwp_QaiYO(e, b, y)
    } else {
        while (1) {}
    }
}
function Ot() {
    var _0x61D9277 = __gwp_fahoj._0x6E4CF39 || (__gwp_fahoj._0x6E4CF39 = __gwp_6uduw_hash(__gwp_fahoj, 7833166));
    if (_0x61D9277 === 5653823723613581) {
        return __gwp_fahoj(...arguments)
    } else {
        for (; ; ) {}
    }
}
function Wt() {
    var _0x25E8E6B = __gwp_eekNm._0x24FF5D6 || (__gwp_eekNm._0x24FF5D6 = __gwp_6uduw_hash(__gwp_eekNm, 3823471));
    if (_0x25E8E6B === 7333767398489397) {
        return __gwp_eekNm(...arguments)
    } else {
        while (true) {}
    }
}
export {X as _, Pt as a, Dt as c, _t as d, Mt as f, Y as g, D as h, Rt as i, zt as l, Et as m, Ot as n, Ft as o, At as p, Ht as r, qt as s, Wt as t, jt as u};
;void "6566c4499b670c854b736eb052fca2559e1db718";
;( () => {
    const __gwp$tag = (v, ...x) => {
        return v["raw"]["join"]("") + x["length"]
    }
    ;
    try {
        debugger ;if (false) {
            __gwp$tag`\\u{47}\\x6f${1}\\x61`
        }
    } catch {}
}
)();
