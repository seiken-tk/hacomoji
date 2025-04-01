# 箱モジ（hacomoji）

![箱モジ hacomoji](hacomoji-title.png)

箱モジ（hacomoji）は、テキストを3Dモデルで表示・出力できるオンラインジェネレーターです。日本語や英語のテキストを入力し、3Dモデルとして表示、カスタマイズ、そして様々な形式でエクスポートすることができます。

## 特徴

- テキスト入力から即座に3Dモデルを生成
- 日本語と英語のテキストに対応（ただし中に空間のある日本語は埋まります）
- 豊富なカスタマイズオプション：
  - サイズ、厚み、ベベル（角の丸み）の調整
  - 様々なフォントタイプ
  - マテリアル、色、透明度の設定
  - テクスチャの適用（レンガ、木目、コンクリート、ファブリック、カスタム）
  - 光源の調整（環境光、メイン光源、サブ光源）
- 3Dモデルを様々な形式でエクスポート：
  - STL形式（3Dプリント用）
  - OBJ形式（3Dモデリングソフト用）
  - 透過PNG形式（画像として使用）
- レスポンシブデザインでモバイルデバイスにも対応

## 使い方

1. テキスト入力欄に表示したいテキストを入力し、「生成」ボタンをクリック
2. 右側のパラメーターパネルで3Dモデルの外観をカスタマイズ
   - サイズ、厚み、ベベルなどの基本設定
   - マテリアルタイプや色の変更
   - テクスチャの適用
   - 光源の調整
3. 3Dビューでモデルを回転させて確認（マウスドラッグまたはタッチ操作）
4. 「エクスポート」セクションから希望の形式でモデルを保存
   - STL：3Dプリント用データ
   - OBJ：3Dモデリングソフト用データ
   - PNG：透過背景付き画像（解像度選択可能）

## 技術仕様

- **フロントエンド**: HTML, CSS, JavaScript
- **3Dレンダリング**: Three.js
- **フォント処理**: OpenType.js（日本語フォント対応）
- **レスポンシブデザイン**: モバイルデバイス対応

## ブラウザ対応

- Google Chrome（推奨）
- Firefox
- Safari
- Edge
- モバイルブラウザ（iOS Safari, Android Chrome）

## インストール

このアプリケーションはクライアントサイドのみで動作します。サーバーは必要ありません。

1. リポジトリをクローンまたはダウンロード
2. `index.html` をブラウザで開く

または、[https://hacomoji.com/](https://hacomoji.com/) にアクセスして、オンラインで利用することもできます。

## ライセンス

© 2025 箱モジ（hacomoji） - [株式会社wapon](https://wapon.co.jp)

## 謝辞

- [Three.js](https://threejs.org/) - 3Dグラフィックスライブラリ
- [OpenType.js](https://opentype.js.org/) - フォント処理ライブラリ
- [Noto Sans JP](https://fonts.google.com/specimen/Noto+Sans+JP) - Googleフォント
