# ふーさんのゲームひろば 🐻

▶ **ひらく: https://ryowatanabe1161-svg.github.io/fuusan-games/**

ふーさん🐻のオリジナルブラウザゲームを集めたポータルページです。スマホでホーム画面に追加すると、アプリのように起動できます（PWA）。

| ゲーム | 人数 | |
|---|---|---|
| [ノーサンキュー！](https://ryowatanabe1161-svg.github.io/nothanks-online/) | 3〜7人 | オンライン・対戦 |
| [おぼえてオーダー！〜ふーさんの森カフェ〜](https://ryowatanabe1161-svg.github.io/oboete-order/) | 2〜6人 | オンライン・協力 |
| [封魔の刻](https://ryowatanabe1161-svg.github.io/fuuma-no-toki/) | 1〜5人 | オンライン・協力 |
| [たとえてナラベ！](https://ryowatanabe1161-svg.github.io/tatoete-narabe/) | 2〜10人 | オンライン・協力 |
| [みえない迷路 〜ふーさんと まほうのしるし〜](https://ryowatanabe1161-svg.github.io/mienai-meiro/) | 2〜4人 | オンライン・対戦 |
| [ふーさんの もりびらき](https://ryowatanabe1161-svg.github.io/moribiraki/) | 3〜4人 | オンライン／1台・対戦 |
| [ふーです🐻。トーストに塗るのはメイプルシロップです。](https://ryowatanabe1161-svg.github.io/oboeteru-watashi/) | 2〜8人 | オンライン・パーティー |
| [ひとことヒント 〜かぶったら きえちゃうクマ〜](https://ryowatanabe1161-svg.github.io/hitokoto-hint/) | 2〜8人 | オンライン・協力・パーティー |
| [角取り陣](https://ryowatanabe1161-svg.github.io/kakutori-jin/) | 2〜4人 | オンライン・対戦 |
| [いろタイル工房 〜ふーさんの宮殿の壁〜](https://ryowatanabe1161-svg.github.io/iro-tile-koubou/) | 2〜4人 | オンライン・対戦 |
| [数列陣 〜ふーさんと数字タイルの陣〜](https://ryowatanabe1161-svg.github.io/suuretsu-jin/) | 2〜4人 | オンライン・対戦 |
| [ななめくり 〜ふーさんの どきどき山札〜](https://ryowatanabe1161-svg.github.io/nanamekuri/) | 2〜8人 | オンライン・対戦・パーティー |
| [ごもじでピタリ 〜ふーさんの いいかえクイズ〜](https://ryowatanabe1161-svg.github.io/gomoji-pitari/) | 3〜6人 | オンライン・パーティー |
| [ころいろ 〜ふーさんの のこり色にご用心〜](https://ryowatanabe1161-svg.github.io/koroiro/) | 2〜4人 | オンライン・対戦 |
| [よびごえの館 〜森の奥の わかれ道〜](https://ryowatanabe1161-svg.github.io/yobigoe-yakata/) | 1〜4人 | オンライン・協力 |
| [ずれっこ 〜ひとりだけ ちがうお題〜](https://ryowatanabe1161-svg.github.io/zurekko/) | 1〜8人 | オンライン・パーティー |
| [とどけ！こいぶみ 〜ふーさんたちの お城でドキドキ大作戦〜](https://ryowatanabe1161-svg.github.io/todoke-koibumi/) | 2〜6人 | オンライン・対戦 |
| [すくすくガーデン 〜ふーさんたちの 小さい順ならべ〜](https://ryowatanabe1161-svg.github.io/sukusuku-garden/) | 2〜5人 | オンライン・対戦 |
| [王国争覇 〜ふーさんたちの デッキ構築バトル〜](https://ryowatanabe1161-svg.github.io/oukoku-souha/) | 2〜4人 | オンライン・対戦 |
| [ふらっとクリーチャーズ 〜オリジナル モンスターバトル〜](https://ryowatanabe1161-svg.github.io/flat-creatures/) | 1〜2人 | オンライン・対戦 |
| [幻獣デュエル 〜ネオ・アリーナ〜](https://ryowatanabe1161-svg.github.io/genjuu-duel/) | 1〜2人 | オンライン／1台・対戦 |

## ホーム画面に追加
- **iPhone（Safari）**：共有ボタン →「ホーム画面に追加」
- **Android（Chrome）**：ページ内の「ホーム画面に追加する」ボタン、または ︙メニュー →「ホーム画面に追加」

## しくみ
- `index.html`（ページ本体・ゲーム一覧）/ `manifest.json` / `sw.js`（このページだけをキャッシュ。スコープは `/fuusan-games/` なので、同じドメインのほかのゲームには影響しません）/ `icons/`
- アイコンは `tools/bear.svg` から `node tools/make-icons.js` で生成
- ホーム画面から起動したとき、ゲームはアプリの範囲外（別パス）として開きます。ひろばに戻るには iPhone は画面左はしから右へスワイプ（または「完了」）、Android は戻るボタン。
