document.addEventListener('DOMContentLoaded', () => {

    const bulkEditBtn = document.getElementById('bulkEditBtn');
    const addCardBtn = document.getElementById('addCardBtn');
    const randomBtn = document.getElementById('randomBtn');
    const layoutToggleButton = document.getElementById('layoutToggleButton');
    const toggleDisplayBtn = document.getElementById('toggleDisplayBtn');
    const toggleDisplayIcon = document.getElementById('toggleDisplayIcon');
    const toggleDisplayFurigana = document.getElementById('toggleDisplayFurigana');
    const deleteModeBtn = document.getElementById('deleteModeBtn');
    const bulkToggleQaBtn = document.getElementById('bulkToggleQaBtn');
    const flashcardsContainer = document.getElementById('flashcards');

    const modeToggleButton = document.getElementById('modeToggleButton');
    const darkModeToggle = document.getElementById('darkModeToggle');

    const addCardModal = document.getElementById('addCardModal');
    const closeButton = document.querySelector('.close-button');
    const qaPairsInputArea = document.getElementById('qaPairsInputArea');
    const addQaPairBtn = document.getElementById('addQaPairBtn');
    const saveCardBtn = document.getElementById('saveCardBtn');



    const bulkEditModal = document.getElementById('bulkEditModal');
    const bulkEditCloseButton = document.getElementById('bulkEditCloseButton');
    const bulkEditInput = document.getElementById('bulkEditInput');
    const saveBulkEditBtn = document.getElementById('saveBulkEditBtn');

    // 新しい単語帳切り替えモーダルの要素
    const vocabularySwitcherModal = document.getElementById('vocabularySwitcherModal');
    const switcherCloseButton = document.getElementById('switcherCloseButton');
    const vocabularyListDiv = document.getElementById('vocabularyList');
    const newVocabularyNameInput = document.getElementById('newVocabularyName');
    const addVocabularyBtn = document.getElementById('addVocabularyBtn');

    // データ構造の変更：複数の単語帳を管理
    // { "vocabularyId": { flashcardsData: [], displayMode: "all", isRandomized: false, currentDisplayOrder: [], name: "単語帳名", order: 0 } }
    let allVocabularies = JSON.parse(localStorage.getItem('allVocabularies')) || {};
    let currentVocabularyId = localStorage.getItem('currentVocabularyId') || null;

    // 単語帳の表示順序を保持する配列 (IDの配列)
    let vocabularyOrder = JSON.parse(localStorage.getItem('vocabularyOrder')) || [];

    // 初期化時に、もし単語帳が一つもなければ"Default"単語帳を作成
    if (Object.keys(allVocabularies).length === 0) {
        const defaultVocabId = 'default_vocabulary';
        allVocabularies[defaultVocabId] = {
            name: 'シンプル単語帳',
            flashcardsData: [],
            displayMode: 'all',
            isRandomized: false,
            currentDisplayOrder: []
        };
        currentVocabularyId = defaultVocabId;
        vocabularyOrder.push(defaultVocabId);
        localStorage.setItem('currentVocabularyId', currentVocabularyId);
        localStorage.setItem('allVocabularies', JSON.stringify(allVocabularies));
        localStorage.setItem('vocabularyOrder', JSON.stringify(vocabularyOrder));
    } else if (!currentVocabularyId || !allVocabularies[currentVocabularyId]) {
        // 保存されていたcurrentVocabularyIdが無効な場合、vocabularyOrderの最初の単語帳を選択
        currentVocabularyId = vocabularyOrder.length > 0 ? vocabularyOrder[0] : Object.keys(allVocabularies)[0];
        localStorage.setItem('currentVocabularyId', currentVocabularyId);
    }

    // vocabularyOrder が allVocabularies と同期しているか確認し、調整する
    const syncVocabularyOrder = () => {
        const existingVocabIds = new Set(Object.keys(allVocabularies));
        // 存在する単語帳のみをフィルタリング
        vocabularyOrder = vocabularyOrder.filter(id => existingVocabIds.has(id));
        // vocabularyOrderに存在しない新規の単語帳を追加
        Object.keys(allVocabularies).forEach(id => {
            if (!vocabularyOrder.includes(id)) {
                vocabularyOrder.push(id);
            }
        });
        localStorage.setItem('vocabularyOrder', JSON.stringify(vocabularyOrder));
    };
    syncVocabularyOrder();


    // 現在の単語帳のデータを取得
    let currentVocabulary = allVocabularies[currentVocabularyId];
    let flashcardsData = currentVocabulary.flashcardsData;
    let displayMode = currentVocabulary.displayMode;
    let isRandomized = currentVocabulary.isRandomized;
    let currentDisplayOrder = currentVocabulary.currentDisplayOrder;
    let isSelectionMode = false;
    let isDarkMode = JSON.parse(localStorage.getItem('isDarkMode')) || false;
    // レイアウト状態を管理する新しい変数: 'large', 'medium', 'small'
    let layoutState = localStorage.getItem('layoutState') || 'large'; 

    // ヘッダーのタイトルを更新
    const updateHeaderTitle = () => {
        const vocabName = allVocabularies[currentVocabularyId] ? allVocabularies[currentVocabularyId].name : '現在の単語帳';
        // 「シンプル単語帳 - 単語帳名」から「単語帳名」のみに変更
        document.querySelector('h1').textContent = vocabName;
    };

    // 表示切り替えボタンのテキストを更新する関数
    const updateDisplayToggleButtonText = () => {
        if (displayMode === 'all') {
            toggleDisplayIcon.textContent = 'select_all';
            toggleDisplayFurigana.textContent = '全て表示';
        } else if (displayMode === 'checked') {
            toggleDisplayIcon.textContent = 'check_box';
            toggleDisplayFurigana.textContent = 'オンのみ';
        } else {
            toggleDisplayIcon.textContent = 'check_box_outline_blank';
            toggleDisplayFurigana.textContent = 'オフのみ';
        }
    };

    // レイアウト変更ボタンのアイコンを更新する関数
    const updateLayoutToggleButtonIcon = () => {
        const iconSpan = layoutToggleButton.querySelector('.material-icons');
        if (layoutState === 'large') {
            iconSpan.textContent = 'rectangle'; // Large: 一覧表示っぽいアイコン
        } else if (layoutState === 'medium') {
            iconSpan.textContent = 'view_stream'; // Medium: グリッド表示っぽいアイコン
        } else {
            iconSpan.textContent = 'grid_view'; // Small: アプリケーションのアイコンっぽい
        }
    };


    const assignCardIds = (cards) => {
        return cards.map(card => {
            if (!card.id) {
                card.id = 'card_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            }
            if (card.qaPairs) {
                card.qaPairs = card.qaPairs.map(qaPair => {
                    if (!qaPair.id) {
                        qaPair.id = 'qa_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                    }
                    return qaPair;
                });
            }
            return card;
        });
    };

    // ロード時に全ての単語帳データのIDをチェック・付与
    for (const vocabId in allVocabularies) {
        allVocabularies[vocabId].flashcardsData = assignCardIds(allVocabularies[vocabId].flashcardsData);
    }

    const saveFlashcards = () => {
        const currentDisplayOrderIds = currentDisplayOrder.map(card => card.id);

        allVocabularies[currentVocabularyId] = {
            flashcardsData: flashcardsData,
            displayMode: displayMode,
            isRandomized: isRandomized,
            currentDisplayOrder: currentDisplayOrderIds,
            name: allVocabularies[currentVocabularyId].name
        };
        localStorage.setItem('allVocabularies', JSON.stringify(allVocabularies));
        localStorage.setItem('currentVocabularyId', currentVocabularyId);
        localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
        localStorage.setItem('layoutState', layoutState);
        localStorage.setItem('vocabularyOrder', JSON.stringify(vocabularyOrder));
    };

    const applyDarkMode = () => {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            document.querySelector('.container').classList.add('dark-mode');
            document.querySelectorAll('.modal-content').forEach(modal => modal.classList.add('dark-mode'));
            document.querySelectorAll('.qa-pair-input').forEach(input => input.classList.add('dark-mode'));
            document.querySelectorAll('.modal-question-input, .modal-answer-input').forEach(input => input.classList.add('dark-mode'));
            document.querySelectorAll('#bulkEditInput').forEach(input => input.classList.add('dark-mode'));
            document.querySelectorAll('#vocabularyList').forEach(list => list.classList.add('dark-mode'));
            document.querySelectorAll('#newVocabularyName, .vocabulary-name-input').forEach(input => input.classList.add('dark-mode'));
            document.querySelectorAll('.flashcard').forEach(card => card.classList.add('dark-mode'));
            document.querySelectorAll('.qa-count').forEach(count => count.classList.add('dark-mode'));
        } else {
            document.body.classList.remove('dark-mode');
            document.querySelector('.container').classList.remove('dark-mode');
            document.querySelectorAll('.modal-content').forEach(modal => modal.classList.remove('dark-mode'));
            document.querySelectorAll('.qa-pair-input').forEach(input => input.classList.remove('dark-mode'));
            document.querySelectorAll('.modal-question-input, .modal-answer-input').forEach(input => input.classList.remove('dark-mode'));
            document.querySelectorAll('#bulkEditInput').forEach(input => input.classList.remove('dark-mode'));
            document.querySelectorAll('#vocabularyList').forEach(list => list.classList.remove('dark-mode'));
            document.querySelectorAll('#newVocabularyName, .vocabulary-name-input').forEach(input => input.classList.remove('dark-mode'));
            document.querySelectorAll('.flashcard').forEach(card => card.classList.remove('dark-mode'));
            document.querySelectorAll('.qa-count').forEach(count => count.classList.remove('dark-mode'));
        }
    };

    const updateDeleteButtonState = () => {
        const selectedCount = flashcardsData.filter(card => card.selectedForDeletion).length;
        if (isSelectionMode) {
            if (selectedCount > 0) {
                deleteModeBtn.innerHTML = `<span class="material-icons">delete</span><span class="button-furigana">削除実行 (${selectedCount})</span>`;
                deleteModeBtn.style.backgroundColor = '#dc3545';
                deleteModeBtn.classList.remove('cancel-button');
            } else {
                deleteModeBtn.innerHTML = `<span class="material-icons">delete</span><span class="button-furigana">キャンセル</span>`;
                deleteModeBtn.style.backgroundColor = '#6c757d';
                deleteModeBtn.classList.add('cancel-button');
            }
        } else {
            deleteModeBtn.innerHTML = `<span class="material-icons">delete</span><span class="button-furigana">削除</span>`;
            deleteModeBtn.style.backgroundColor = '#dc3545';
            deleteModeBtn.classList.remove('cancel-button');
        }
    };

    function adjustFontSize(cardElement) {
        const contentDiv = cardElement.querySelector('.flashcard-content');
        if (!contentDiv) return;

        const pElement = cardElement.classList.contains('flipped') ?
            contentDiv.querySelector('.back p') :
            contentDiv.querySelector('.front p');

        if (!pElement) return;

        const text = pElement.textContent.trim();

        if (text === '') {
            pElement.style.fontSize = '2em';
            pElement.style.display = 'flex';
            pElement.style.justifyContent = 'center';
            pElement.style.alignItems = 'center';
            pElement.style.height = '100%';
            pElement.style.whiteSpace = 'normal';
            pElement.style.wordBreak = 'normal';
            pElement.style.overflow = 'hidden';
            pElement.style.textOverflow = 'ellipsis';
            return;
        }

        const tempP = document.createElement('p');
        tempP.textContent = text;

        const computedStyle = window.getComputedStyle(pElement);
        for (const prop of ['fontFamily', 'fontWeight', 'letterSpacing', 'wordSpacing', 'textTransform', 'lineHeight']) {
            tempP.style[prop] = computedStyle[prop];
        }
        tempP.style.margin = '0';
        tempP.style.padding = '0';
        tempP.style.whiteSpace = 'pre-wrap';
        tempP.style.wordBreak = 'break-word';
        tempP.style.overflowWrap = 'break-wrap';
        tempP.style.overflow = 'hidden';
        tempP.style.textOverflow = 'ellipsis';

        tempP.style.position = 'absolute';
        tempP.style.visibility = 'hidden';
        tempP.style.height = 'auto';
        document.body.appendChild(tempP);

        const parentWidth = contentDiv.clientWidth;
        const parentHeight = contentDiv.clientHeight;

        const contentStyle = window.getComputedStyle(contentDiv);
        const contentPaddingLeft = parseFloat(contentStyle.paddingLeft);
        const contentPaddingRight = parseFloat(contentStyle.paddingRight);
        const contentPaddingTop = parseFloat(contentStyle.paddingTop);
        const contentPaddingBottom = parseFloat(contentStyle.paddingBottom);

        const availableWidth = parentWidth - contentPaddingLeft - contentPaddingRight;
        const availableHeight = parentHeight - contentPaddingTop - contentPaddingBottom;

        let minFontSize = 8;
        let maxFontSize = 100;
        let bestFitFontSize = minFontSize;

        let low = minFontSize;
        let high = maxFontSize;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            tempP.style.fontSize = `${mid}px`;
            tempP.style.width = `${availableWidth}px`;

            const isOverflowingHeight = tempP.scrollHeight > availableHeight + 1;

            if (!isOverflowingHeight) {
                bestFitFontSize = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        document.body.removeChild(tempP);

        pElement.style.fontSize = `${bestFitFontSize}px`;
        pElement.style.display = 'flex';
        pElement.style.justifyContent = 'center';
        pElement.style.alignItems = 'center';
        pElement.style.height = '100%';
        pElement.style.overflow = 'hidden';
        pElement.style.textOverflow = 'ellipsis';
        pElement.style.whiteSpace = 'pre-wrap';
        pElement.style.wordBreak = 'break-word';
    }

    const renderFlashcards = (forceRandom = false) => {
        flashcardsContainer.innerHTML = '';

        let cardsToRender = [];

        // 既存のカードデータに isAnswerDisplayed を追加（初回ロード時やデータ移行時に対応）
        flashcardsData.forEach(card => {
            if (card.isAnswerDisplayed === undefined) {
                card.isAnswerDisplayed = false;
            }
        });

        // ページロード時とランダムボタン、表示切り替えボタン押下時にisAnswerDisplayedをfalseにする
        if (!forceRandom && !isRandomized && !isSelectionMode) { // ランダムボタン、表示切り替えボタン以外で呼ばれた場合
             flashcardsData.forEach(card => {
                card.isAnswerDisplayed = false;
             });
        }
        // forceRandom (ランダムボタン押下時) も isAnswerDisplayed を false にする
        if (forceRandom) {
            flashcardsData.forEach(card => {
                card.isAnswerDisplayed = false;
            });
        }
        
        // 表示切り替えボタン押下時も isAnswerDisplayed を false にする
        // これは toggleDisplayBtn のイベントリスナー内で renderFlashcards(false) が呼ばれるため、
        // 上の !forceRandom && !isRandomized && !isSelectionMode の条件でカバーされる。
        // ただし、明示的に記述する場合は以下のようになる。
        // if (calledFromToggleDisplayBtn) { // 仮の変数
        //     flashcardsData.forEach(card => {
        //         card.isAnswerDisplayed = false;
        //     });
        // }


        if (forceRandom) {
            cardsToRender = [...flashcardsData];
            for (let i = cardsToRender.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [cardsToRender[i], cardsToRender[j]] = [cardsToRender[j], cardsToRender[i]];
            }
            currentDisplayOrder = cardsToRender;
            isRandomized = true;
        } else if (isRandomized) {
            const existingCardMap = new Map(flashcardsData.map(card => [card.id, card]));
            cardsToRender = currentVocabulary.currentDisplayOrder.map(id => existingCardMap.get(id)).filter(card => card !== undefined);

            const currentOrderIds = new Set(cardsToRender.map(card => card.id));
            flashcardsData.forEach(card => {
                if (!currentOrderIds.has(card.id)) {
                    cardsToRender.push(card);
                }
            });
            currentDisplayOrder = cardsToRender;
        } else {
            cardsToRender = [...flashcardsData];
            currentDisplayOrder = cardsToRender;
            isRandomized = false;
        }

        let filteredAndOrderedCards = [];
        if (displayMode === 'all') {
            filteredAndOrderedCards = cardsToRender;
        } else if (displayMode === 'checked') {
            filteredAndOrderedCards = cardsToRender.filter(card => card.checked);
        } else if (displayMode === 'unchecked') {
            filteredAndOrderedCards = cardsToRender.filter(card => !card.checked);
        }

        // レイアウトに基づいてクラスを適用/削除
        flashcardsContainer.classList.remove('grid-view-layout', 'min-view-layout');
        if (layoutState === 'medium') {
            flashcardsContainer.classList.add('grid-view-layout');
        } else if (layoutState === 'small') {
            flashcardsContainer.classList.add('min-view-layout');
        }


        filteredAndOrderedCards.forEach((cardData) => {
            const flashcard = document.createElement('div');
            flashcard.classList.add('flashcard');
            flashcard.dataset.cardId = cardData.id;

            if (isDarkMode) {
                flashcard.classList.add('dark-mode');
            }

            if (isSelectionMode) {
                flashcard.classList.add('selection-mode');
            }
            if (cardData.selectedForDeletion) {
                flashcard.classList.add('selected-for-deletion');
            }

            const cardContent = document.createElement('div');
            cardContent.classList.add('flashcard-content');

            const frontContent = document.createElement('div');
            frontContent.classList.add('front');
            const backContent = document.createElement('div');
            backContent.classList.add('back');

            const currentQaIndex = cardData.currentQaIndex || 0;

            // 空白の場合の表示を調整
            const questionText = cardData.qaPairs.length > 0 ? (cardData.qaPairs[currentQaIndex].question || '問題') : '問題';
            const answerText = cardData.qaPairs.length > 0 ? (cardData.qaPairs[currentQaIndex].answer || '答え') : '答え';

            frontContent.innerHTML = `<p>${questionText.replace(/\n/g, '<br>')}</p>`;
            backContent.innerHTML = `<p>${answerText.replace(/\n/g, '<br>')}</p>`;

            cardContent.appendChild(frontContent);
            cardContent.appendChild(backContent);
            flashcard.appendChild(cardContent);

            // QAセット数表示を追加
            const qaCountDiv = document.createElement('div');
            qaCountDiv.classList.add('qa-count');
            // currentQaIndexは0から始まるので、+1して表示
            qaCountDiv.textContent = `${currentQaIndex + 1}/${cardData.qaPairs.length}`;
            if (isDarkMode) {
                qaCountDiv.classList.add('dark-mode');
            }
            flashcard.appendChild(qaCountDiv);


            flashcardsContainer.appendChild(flashcard);

            // カードの初期表示状態をセット
            if (cardData.isAnswerDisplayed) {
                flashcard.classList.add('flipped');
            } else {
                flashcard.classList.remove('flipped');
            }

            adjustFontSize(flashcard);

            cardContent.addEventListener('click', () => {
                const targetCardId = flashcard.dataset.cardId;
                const originalCardIndex = flashcardsData.findIndex(card => card.id === targetCardId);
                if (originalCardIndex === -1) return;

                if (isSelectionMode) {
                    flashcardsData[originalCardIndex].selectedForDeletion = !flashcardsData[originalCardIndex].selectedForDeletion;
                    if (flashcardsData[originalCardIndex].selectedForDeletion) {
                        flashcard.classList.add('selected-for-deletion');
                    } else {
                        flashcard.classList.remove('selected-for-deletion');
                    }
                    updateDeleteButtonState();
                } else {
                    flashcard.classList.toggle('flipped');
                    // カードの表示状態をデータに保存
                    flashcardsData[originalCardIndex].isAnswerDisplayed = flashcard.classList.contains('flipped');
                    saveFlashcards();
                    setTimeout(() => adjustFontSize(flashcard), 50);
                }
            });

            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('flashcard-actions');

            const editBtn = document.createElement('button');
            editBtn.classList.add('edit-btn');
            editBtn.textContent = '編集';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!isSelectionMode) {
                    const targetCardId = flashcard.dataset.cardId;
                    const originalCardIndex = flashcardsData.findIndex(card => card.id === targetCardId);
                    if (originalCardIndex === -1) return;
                    editCard(originalCardIndex);
                }
            });
            actionsDiv.appendChild(editBtn);

            if (cardData.qaPairs.length > 1) {
                const toggleBtn = document.createElement('button');
                toggleBtn.classList.add('toggle-btn');
                toggleBtn.textContent = '切り替え';
                toggleBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (!isSelectionMode) {
                        const targetCardId = flashcard.dataset.cardId;
                        const originalCardIndex = flashcardsData.findIndex(card => card.id === targetCardId);
                        if (originalCardIndex === -1) return;
                        toggleQaPair(originalCardIndex, flashcard);
                        setTimeout(() => adjustFontSize(flashcard), 50);
                    }
                });
                actionsDiv.appendChild(toggleBtn);
            }

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = cardData.checked || false;
            checkbox.addEventListener('change', (e) => {
                if (!isSelectionMode) {
                    const targetCardId = flashcard.dataset.cardId;
                    const originalCardIndex = flashcardsData.findIndex(card => card.id === targetCardId);
                    if (originalCardIndex === -1) return;

                    flashcardsData[originalCardIndex].checked = e.target.checked;
                    saveFlashcards();
                } else {
                    e.preventDefault();
                }
            });
            actionsDiv.appendChild(checkbox);

            flashcard.appendChild(actionsDiv);
        });
        updateDeleteButtonState();
    };

    const addQaPairInput = (question = '', answer = '', qaId = null) => {
        const qaPairDiv = document.createElement('div');
        qaPairDiv.classList.add('qa-pair-input');
        if (qaId) {
            qaPairDiv.dataset.qaId = qaId;
        }
        if (isDarkMode) {
            qaPairDiv.classList.add('dark-mode');
        }

        const questionTextarea = document.createElement('textarea');
        questionTextarea.classList.add('modal-question-input');
        questionTextarea.placeholder = '問題文を入力';
        questionTextarea.value = question;
        if (isDarkMode) {
            questionTextarea.classList.add('dark-mode');
        }

        const answerTextarea = document.createElement('textarea');
        answerTextarea.classList.add('modal-answer-input');
        answerTextarea.placeholder = '答えを入力';
        answerTextarea.value = answer;
        if (isDarkMode) {
            answerTextarea.classList.add('dark-mode');
        }

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-qa-pair-btn');
        removeBtn.textContent = '削除';
        removeBtn.addEventListener('click', () => {
            if (qaPairsInputArea.querySelectorAll('.qa-pair-input').length > 1) {
                qaPairDiv.remove();
            } else {
                alert('最低1つの問題と答えのセットが必要です。');
            }
        });

        qaPairDiv.appendChild(questionTextarea);
        qaPairDiv.appendChild(answerTextarea);
        qaPairDiv.appendChild(removeBtn);
        qaPairsInputArea.appendChild(qaPairDiv);
    };

    addCardBtn.addEventListener('click', () => {
        if (isSelectionMode) {
            alert('選択モードを終了してからカードを追加してください。');
            return;
        }
        qaPairsInputArea.innerHTML = '';
        addQaPairInput();
        addCardModal.style.display = 'block';
        if (isDarkMode) {
            addCardModal.querySelector('.modal-content').classList.add('dark-mode');
        }


        const oldSaveCardBtn = document.getElementById('saveCardBtn');
        const newSaveCardBtn = oldSaveCardBtn.cloneNode(true);
        oldSaveCardBtn.replaceWith(newSaveCardBtn);
        newSaveCardBtn.addEventListener('click', () => handleSaveCard(null));
    });

    const closeModal = (modalElement) => {
        modalElement.style.display = 'none';
        modalElement.querySelector('.modal-content').classList.remove('dark-mode');
        modalElement.querySelectorAll('.modal-question-input, .modal-answer-input, #bulkEditInput, #newVocabularyName, .vocabulary-name-input').forEach(input => input.classList.remove('dark-mode'));
        modalElement.querySelectorAll('.qa-pair-input').forEach(input => input.classList.remove('dark-mode'));
        modalElement.querySelectorAll('#vocabularyList').forEach(list => list.classList.remove('dark-mode'));
    };

    closeButton.addEventListener('click', () => {
        closeModal(addCardModal);
    });



    bulkEditCloseButton.addEventListener('click', () => {
        closeModal(bulkEditModal);
    });

    switcherCloseButton.addEventListener('click', () => {
        closeModal(vocabularySwitcherModal);
    });

    window.addEventListener('click', (event) => {
        if (event.target == addCardModal) {
            closeModal(addCardModal);
        }

        if (event.target == bulkEditModal) {
            closeModal(bulkEditModal);
        }
        if (event.target == vocabularySwitcherModal) {
            closeModal(vocabularySwitcherModal);
        }
    });

    addQaPairBtn.addEventListener('click', () => {
        addQaPairInput();
    });

    const handleSaveCard = (cardIndexToEdit = null) => {
        const qaPairs = [];
        let isEmptyInput = true;

        qaPairsInputArea.querySelectorAll('.qa-pair-input').forEach(qaPairDiv => {
            const question = qaPairDiv.querySelector('.modal-question-input').value.trim();
            const answer = qaPairDiv.querySelector('.modal-answer-input').value.trim();
            const qaId = qaPairDiv.dataset.qaId || 'qa_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

            if (question !== '' || answer !== '') {
                isEmptyInput = false;
            }
            qaPairs.push({ id: qaId, question, answer });
        });

        if (isEmptyInput) {
            alert('問題と答えのどちらか一方、または両方を入力してください。');
            return;
        }

        if (qaPairs.length === 0) {
            alert('最低1つの問題と答えのセットが必要です。');
            return;
        }

        const sanitizedQaPairs = qaPairs.map(pair => ({
            id: pair.id,
            question: pair.question === '' ? '問題' : pair.question,
            answer: pair.answer === '' ? '答え' : pair.answer
        }));


        if (cardIndexToEdit !== null) {
            flashcardsData[cardIndexToEdit].qaPairs = sanitizedQaPairs;
            // 編集後も現在のQAインデックスが有効な範囲内であることを確認
            if (flashcardsData[cardIndexToEdit].currentQaIndex >= sanitizedQaPairs.length) {
                flashcardsData[cardIndexToEdit].currentQaIndex = 0;
            }
        } else {
            const newCard = {
                id: 'card_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                qaPairs: sanitizedQaPairs,
                currentQaIndex: 0,
                checked: false,
                selectedForDeletion: false,
                isAnswerDisplayed: false // 新しいカードはデフォルトで問題表示
            };
            flashcardsData.push(newCard);
            isRandomized = false;
        }

        saveFlashcards();
        renderFlashcards(false); // カード保存後は問題表示に戻す
        closeModal(addCardModal);
    };

    saveCardBtn.addEventListener('click', () => handleSaveCard(null));

    randomBtn.addEventListener('click', () => {
        if (isSelectionMode) {
            alert('選択モードを終了してからランダム表示してください。');
            return;
        }
        if (flashcardsData.length === 0) {
            alert('単語カードがありません。');
            flashcardsContainer.innerHTML = '';
            currentDisplayOrder = [];
            isRandomized = false;
            saveFlashcards();
            return;
        }
        // ランダムボタン押下時、全カードの isAnswerDisplayed を false にする
        flashcardsData.forEach(card => card.isAnswerDisplayed = false);
        renderFlashcards(true);
        saveFlashcards();
    });

    layoutToggleButton.addEventListener('click', () => {
        if (isSelectionMode) {
            alert('選択モードを終了してからレイアウトを変更してください。');
            return;
        }
        if (layoutState === 'large') {
            layoutState = 'medium';
        } else if (layoutState === 'medium') {
            layoutState = 'small';
        } else {
            layoutState = 'large';
        }
        updateLayoutToggleButtonIcon();
        renderFlashcards(false);
        saveFlashcards();
    });

    bulkToggleQaBtn.addEventListener('click', () => {
        if (isSelectionMode) {
            alert('選択モードを終了してから一括切り替えをしてください。');
            return;
        }

        let changesMade = false;
        flashcardsData.forEach(cardData => {
            // isAnswerDisplayed を常に false に設定
            cardData.isAnswerDisplayed = false; 
            if (cardData.qaPairs && cardData.qaPairs.length > 0) { // 常に切り替え対象にする (1つしかなくても)
                cardData.currentQaIndex = (cardData.currentQaIndex + 1) % cardData.qaPairs.length;
                changesMade = true;
            }
        });

        if (changesMade) {
            saveFlashcards();
            // renderFlashcards を呼び出して再描画することで、変更が反映され、
            // isAnswerDisplayed = false も適用される
            renderFlashcards(false); 
        } else {
            alert('カードがありません。');
        }
    });


    toggleDisplayBtn.addEventListener('click', () => {
        if (isSelectionMode) {
            alert('選択モードを終了してから表示を切り替えてください。');
            return;
        }
        if (displayMode === 'all') {
            displayMode = 'checked';
        } else if (displayMode === 'checked') {
            displayMode = 'unchecked';
        } else {
            displayMode = 'all';
        }
        // 表示切り替えボタン押下時、全カードの isAnswerDisplayed を false にする
        flashcardsData.forEach(card => card.isAnswerDisplayed = false);
        updateDisplayToggleButtonText();
        renderFlashcards(false);
        saveFlashcards();
    });

    deleteModeBtn.addEventListener('click', () => {
        if (!isSelectionMode) {
            isSelectionMode = true;
            flashcardsData.forEach(card => card.selectedForDeletion = false);
            document.querySelectorAll('.flashcard').forEach(cardElement => {
                cardElement.classList.add('selection-mode');
                cardElement.classList.remove('selected-for-deletion');
            });
            updateDeleteButtonState();
            alert('カードをタップして削除対象を選択してください。');
        } else {
            const cardsToDelete = flashcardsData.filter(card => card.selectedForDeletion);
            if (cardsToDelete.length > 0) {
                if (confirm(`${cardsToDelete.length}枚のカードを削除します。よろしいですか？`)) {
                    const deletedCardIds = new Set(cardsToDelete.map(card => card.id));
                    flashcardsData = flashcardsData.filter(card => !deletedCardIds.has(card.id));

                    isSelectionMode = false;
                    isRandomized = false;

                    currentDisplayOrder = currentDisplayOrder.filter(card => !deletedCardIds.has(card.id));

                    saveFlashcards();
                    renderFlashcards(false);
                } else {
                    flashcardsData.forEach(card => card.selectedForDeletion = false);
                    document.querySelectorAll('.flashcard').forEach(cardElement => {
                        cardElement.classList.remove('selected-for-deletion');
                    });
                    isSelectionMode = false;
                    renderFlashcards(false);
                }
            } else {
                isSelectionMode = false;
                flashcardsData.forEach(card => card.selectedForDeletion = false);
                renderFlashcards(false);
            }
            updateDeleteButtonState();
        }
    });


    const editCard = (cardIndex) => {
        const cardData = flashcardsData[cardIndex];
        qaPairsInputArea.innerHTML = '';

        cardData.qaPairs.forEach(pair => {
            addQaPairInput(pair.question === '問題' ? '' : pair.question, pair.answer === '答え' ? '' : pair.answer, pair.id);
        });

        addCardModal.style.display = 'block';
        if (isDarkMode) {
            addCardModal.querySelector('.modal-content').classList.add('dark-mode');
        }

        const oldSaveCardBtn = document.getElementById('saveCardBtn');
        const newSaveCardBtn = oldSaveCardBtn.cloneNode(true);
        oldSaveCardBtn.replaceWith(newSaveCardBtn);
        newSaveCardBtn.addEventListener('click', () => handleSaveCard(cardIndex));
    };

    const toggleQaPair = (cardIndex, flashcardElement) => {
        const cardData = flashcardsData[cardIndex];
        cardData.currentQaIndex = (cardData.currentQaIndex + 1) % cardData.qaPairs.length;

        // 個別切り替えボタンの場合、現在の表示状態を切り替える
        flashcardElement.classList.toggle('flipped');
        cardData.isAnswerDisplayed = flashcardElement.classList.contains('flipped');

        saveFlashcards();

        const frontContentP = flashcardElement.querySelector('.front p');
        const backContentP = flashcardElement.querySelector('.back p');
        const qaCountDiv = flashcardElement.querySelector('.qa-count');

        const currentQa = cardData.qaPairs[cardData.currentQaIndex];
        const questionText = currentQa.question === '' ? '問題' : currentQa.question;
        const answerText = currentQa.answer === '' ? '答え' : currentQa.answer;

        frontContentP.innerHTML = questionText.replace(/\n/g, '<br>');
        backContentP.innerHTML = answerText.replace(/\n/g, '<br>');

        qaCountDiv.textContent = `${cardData.currentQaIndex + 1}/${cardData.qaPairs.length}`;

        setTimeout(() => adjustFontSize(flashcardElement), 50);
    };



    bulkEditBtn.addEventListener('click', () => {
        if (isSelectionMode) {
            alert('選択モードを終了してから一括編集してください。');
            return;
        }

        let editorContent = '';
        let cardsForEdit = [];
        if (isRandomized) {
            cardsForEdit = currentDisplayOrder;
        } else {
            cardsForEdit = [...flashcardsData];
        }

        let filteredCardsForEdit = [];
        if (displayMode === 'all') {
            filteredCardsForEdit = cardsForEdit;
        } else if (displayMode === 'checked') {
            filteredCardsForEdit = cardsForEdit.filter(card => card.checked);
        } else if (displayMode === 'unchecked') {
            filteredCardsForEdit = cardsForEdit.filter(card => !card.checked);
        }

        filteredCardsForEdit.forEach((card, index) => {
            if (card.qaPairs && card.qaPairs.length > 0) {
                card.qaPairs.forEach((qa) => {
                    const q = qa.question === '問題' ? '' : qa.question;
                    const a = qa.answer === '答え' ? '' : qa.answer;

                    if (q !== '' && a !== '') {
                        editorContent += `${q} ${a}`;
                    } else if (q !== '') {
                        editorContent += q;
                    } else if (a !== '') {
                        editorContent += ` ${a}`;
                    } else {
                        editorContent += '';
                    }

                    editorContent += `${card.checked ? ' 1' : ''}\n`;
                });
            }
            if (index < filteredCardsForEdit.length - 1) {
                editorContent += '\n';
            }
        });
        bulkEditInput.value = editorContent.trim();
        bulkEditModal.style.display = 'block';
        if (isDarkMode) {
            bulkEditModal.querySelector('.modal-content').classList.add('dark-mode');
            bulkEditInput.classList.add('dark-mode');
        }
    });

    saveBulkEditBtn.addEventListener('click', () => {
        const inputText = bulkEditInput.value.trim();

        if (!inputText) {
            if (confirm('入力が空です。全てのカードを削除しますか？')) {
                flashcardsData = [];
                currentDisplayOrder = [];
                saveFlashcards();
                renderFlashcards(false);
                closeModal(bulkEditModal);
                alert('全てのカードを削除しました。');
            }
            return;
        }

        const lines = inputText.split('\n');
        const newFlashcardsData = [];

        let currentCardQaPairs = [];
        let tempCheckedState = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line === '') {
                if (currentCardQaPairs.length > 0) {
                    newFlashcardsData.push({
                        id: 'card_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                        qaPairs: assignCardIds(currentCardQaPairs),
                        currentQaIndex: 0,
                        checked: tempCheckedState,
                        selectedForDeletion: false,
                        isAnswerDisplayed: false
                    });
                    currentCardQaPairs = [];
                    tempCheckedState = false;
                }
            } else {
                let question = '';
                let answer = '';
                let lineChecked = false;

                const checkedMatch = line.match(/^(.*)[\s　]+1$/);
                let contentWithoutChecked = line;

                if (checkedMatch) {
                    lineChecked = true;
                    contentWithoutChecked = checkedMatch[1].trim();
                }

                const qaMatch = contentWithoutChecked.match(/^(.*?)(?:[\s　]+(.+))?$/);

                if (qaMatch) {
                    const qPart = qaMatch[1].trim();
                    const aPart = qaMatch[2] ? qaMatch[2].trim() : '';

                    if (qPart !== '' && aPart !== '') {
                        question = qPart;
                        answer = aPart;
                    } else if (qPart !== '') {
                        question = qPart;
                        answer = '答え';
                    } else if (aPart !== '') {
                        question = '問題';
                        answer = aPart;
                    }
                }
                
                question = question === '' ? '問題' : question;
                answer = answer === '' ? '答え' : answer;


                currentCardQaPairs.push({ question: question, answer: answer });
                tempCheckedState = lineChecked;
            }
        }

        if (currentCardQaPairs.length > 0) {
            newFlashcardsData.push({
                id: 'card_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                qaPairs: assignCardIds(currentCardQaPairs),
                currentQaIndex: 0,
                checked: tempCheckedState,
                selectedForDeletion: false,
                isAnswerDisplayed: false
            });
        }

        flashcardsData = newFlashcardsData;

        isRandomized = false;
        currentDisplayOrder = [...flashcardsData];

        saveFlashcards();
        renderFlashcards(false);
        closeModal(bulkEditModal);
    });

    darkModeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        applyDarkMode();
        saveFlashcards();
        // ダークモード切り替え時はカード表示状態を維持
        renderFlashcards(false); 
    });

    // --- 単語帳切り替え機能関連 ---

    let draggedItem = null;

    const renderVocabularyList = () => {
        vocabularyListDiv.innerHTML = '';

        const sortedVocabularies = vocabularyOrder
            .map(id => allVocabularies[id])
            .filter(vocab => vocab !== undefined);

        sortedVocabularies.forEach((vocab) => {
            const vocabItem = document.createElement('div');
            vocabItem.classList.add('vocabulary-item');
            vocabItem.dataset.vocabId = Object.keys(allVocabularies).find(key => allVocabularies[key] === vocab);
            vocabItem.setAttribute('draggable', true);

            if (vocabItem.dataset.vocabId === currentVocabularyId) {
                vocabItem.classList.add('active-vocabulary');
            }
            if (isDarkMode) {
                vocabItem.classList.add('dark-mode');
            }

            const dragHandle = document.createElement('span');
            dragHandle.classList.add('material-icons', 'drag-handle');
            dragHandle.textContent = 'drag_indicator';
            dragHandle.style.cursor = 'grab';
            vocabItem.appendChild(dragHandle);

            const vocabNameSpan = document.createElement('span');
            vocabNameSpan.classList.add('vocabulary-name');
            vocabNameSpan.textContent = vocab.name || `単語帳 (${vocabItem.dataset.vocabId.substring(0, 8)}...)`;
            vocabItem.appendChild(vocabNameSpan);

            const vocabNameInput = document.createElement('input');
            vocabNameInput.type = 'text';
            vocabNameInput.classList.add('vocabulary-name-input');
            vocabNameInput.value = vocab.name || '';
            if (isDarkMode) {
                vocabNameInput.classList.add('dark-mode');
            }
            vocabItem.appendChild(vocabNameInput);


            const itemActionsDiv = document.createElement('div');
            itemActionsDiv.classList.add('vocabulary-item-actions');

            const renameBtn = document.createElement('button');
            renameBtn.classList.add('rename-vocabulary-btn');
            renameBtn.textContent = '名前変更';
            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                vocabNameSpan.style.display = 'none';
                vocabNameInput.style.display = 'block';
                vocabNameInput.focus();
                renameBtn.style.display = 'none';
                deleteBtn.style.display = 'none';
                saveRenameBtn.style.display = 'inline-block';
                cancelRenameBtn.style.display = 'inline-block';
            });
            itemActionsDiv.appendChild(renameBtn);

            const saveRenameBtn = document.createElement('button');
            saveRenameBtn.classList.add('save-rename-btn');
            saveRenameBtn.textContent = '保存';
            saveRenameBtn.style.display = 'none';
            saveRenameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const newName = vocabNameInput.value.trim();
                if (newName && newName !== vocab.name) {
                    const nameExists = Object.values(allVocabularies).some(
                        (v) => v.name === newName && Object.keys(allVocabularies).find(key => allVocabularies[key] === v) !== vocabItem.dataset.vocabId
                    );
                    if (nameExists) {
                        alert('同じ名前の単語帳が既に存在します。別の名前を入力してください。');
                        return;
                    }

                    vocab.name = newName;
                    vocabNameSpan.textContent = newName;
                    saveFlashcards();
                    updateHeaderTitle();
                    alert('名前を変更しました。');
                } else if (newName === '') {
                    alert('単語帳の名前を空にすることはできません。');
                    vocabNameInput.value = vocab.name;
                }
                vocabNameSpan.style.display = 'block';
                vocabNameInput.style.display = 'none';
                renameBtn.style.display = 'inline-block';
                deleteBtn.style.display = 'inline-block';
                saveRenameBtn.style.display = 'none';
                cancelRenameBtn.style.display = 'none';
            });
            itemActionsDiv.appendChild(saveRenameBtn);

            const cancelRenameBtn = document.createElement('button');
            cancelRenameBtn.classList.add('cancel-rename-btn');
            cancelRenameBtn.textContent = 'キャンセル';
            cancelRenameBtn.style.display = 'none';
            cancelRenameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                vocabNameInput.value = vocab.name;
                vocabNameSpan.style.display = 'block';
                vocabNameInput.style.display = 'none';
                renameBtn.style.display = 'inline-block';
                deleteBtn.style.display = 'inline-block';
                saveRenameBtn.style.display = 'none';
                cancelRenameBtn.style.display = 'none';
            });
            itemActionsDiv.appendChild(cancelRenameBtn);


            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-vocabulary-btn');
            deleteBtn.textContent = '削除';

            if (Object.keys(allVocabularies).length <= 1) {
                deleteBtn.disabled = true;
                deleteBtn.style.opacity = '0.5';
                deleteBtn.style.cursor = 'not-allowed';
                deleteBtn.title = '最後の単語帳は削除できません。';
            } else if (vocabItem.dataset.vocabId === currentVocabularyId) {
                deleteBtn.disabled = true;
                deleteBtn.style.opacity = '0.5';
                deleteBtn.style.cursor = 'not-allowed';
                deleteBtn.title = '現在開いている単語帳は削除できません。別の単語帳に切り替えてから削除してください。';
            } else {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`単語帳「${vocab.name || '現在の単語帳'}」を削除してもよろしいですか？この操作は元に戻せません。`)) {
                        deleteVocabulary(vocabItem.dataset.vocabId);
                    }
                });
            }
            itemActionsDiv.appendChild(deleteBtn);
            vocabItem.appendChild(itemActionsDiv);

            vocabNameSpan.addEventListener('click', () => {
                if (vocabNameInput.style.display !== 'block') {
                    switchVocabulary(vocabItem.dataset.vocabId);
                    closeModal(vocabularySwitcherModal);
                }
            });

            vocabularyListDiv.appendChild(vocabItem);
        });

        const vocabItems = vocabularyListDiv.querySelectorAll('.vocabulary-item');

        vocabItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', item.innerHTML);
                setTimeout(() => item.classList.add('dragging'), 0);
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (draggedItem && draggedItem !== item) {
                    const bounding = item.getBoundingClientRect();
                    const offset = bounding.y + (bounding.height / 2);
                    if (e.clientY < offset) {
                        vocabularyListDiv.insertBefore(draggedItem, item);
                    } else {
                        vocabularyListDiv.insertBefore(draggedItem, item.nextSibling);
                    }
                }
            });

            item.addEventListener('dragleave', () => {
            });

            item.addEventListener('dragend', () => {
                draggedItem.classList.remove('dragging');
                draggedItem = null;
                const newOrderIds = Array.from(vocabularyListDiv.children).map(item => item.dataset.vocabId);
                vocabularyOrder = newOrderIds;
                saveFlashcards();
                renderVocabularyList();
            });
        });
    };

    const switchVocabulary = (newVocabId) => {
        if (!allVocabularies[newVocabId]) {
            console.error('存在しない単語帳IDです:', newVocabId);
            return;
        }

        saveFlashcards();

        currentVocabularyId = newVocabId;
        currentVocabulary = allVocabularies[currentVocabularyId];
        flashcardsData = currentVocabulary.flashcardsData;
        displayMode = currentVocabulary.displayMode;
        isRandomized = currentVocabulary.isRandomized;
        const existingCardMap = new Map(flashcardsData.map(card => [card.id, card]));
        currentDisplayOrder = currentVocabulary.currentDisplayOrder.map(id => existingCardMap.get(id)).filter(card => card !== undefined);
        const currentOrderIds = new Set(currentDisplayOrder.map(card => card.id));
        flashcardsData.forEach(card => {
            if (!currentOrderIds.has(card.id)) {
                currentDisplayOrder.push(card);
            }
        });

        isSelectionMode = false;
        // 単語帳切り替え時、全カードの isAnswerDisplayed を false にする
        flashcardsData.forEach(card => card.isAnswerDisplayed = false);
        saveFlashcards();

        updateHeaderTitle();
        updateDisplayToggleButtonText();
        updateLayoutToggleButtonIcon();
        renderFlashcards(false);
        renderVocabularyList();
    };

    const addVocabulary = () => {
        const newName = newVocabularyNameInput.value.trim();
        if (!newName) {
            alert('新しい単語帳の名前を入力してください。');
            return;
        }
        if (Object.values(allVocabularies).some(vocab => vocab.name === newName)) {
            alert('同じ名前の単語帳が既に存在します。別の名前を入力してください。');
            return;
        }

        const newVocabId = 'vocab_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        allVocabularies[newVocabId] = {
            name: newName,
            flashcardsData: [],
            displayMode: 'all',
            isRandomized: false,
            currentDisplayOrder: []
        };
        vocabularyOrder.push(newVocabId);

        saveFlashcards();
        newVocabularyNameInput.value = '';
        renderVocabularyList();
        alert(`単語帳「${newName}」を追加しました。`);
        switchVocabulary(newVocabId);
    };

    const deleteVocabulary = (vocabIdToDelete) => {
        if (Object.keys(allVocabularies).length <= 1) {
            alert('最後の単語帳は削除できません。');
            return;
        }
        if (vocabIdToDelete === currentVocabularyId) {
            alert('現在開いている単語帳は削除できません。別の単語帳に切り替えてから削除してください。');
            return;
        }

        delete allVocabularies[vocabIdToDelete];
        vocabularyOrder = vocabularyOrder.filter(id => id !== vocabIdToDelete);

        if (currentVocabularyId === vocabIdToDelete) {
            currentVocabularyId = vocabularyOrder.length > 0 ? vocabularyOrder[0] : Object.keys(allVocabularies)[0];
        }

        saveFlashcards();
        renderVocabularyList();
        updateHeaderTitle();
        currentVocabulary = allVocabularies[currentVocabularyId];
        flashcardsData = currentVocabulary.flashcardsData;
        displayMode = currentVocabulary.displayMode;
        isRandomized = currentVocabulary.isRandomized;
        const existingCardMap = new Map(flashcardsData.map(card => [card.id, card]));
        currentDisplayOrder = currentVocabulary.currentDisplayOrder.map(id => existingCardMap.get(id)).filter(card => card !== undefined);
        const currentOrderIds = new Set(currentDisplayOrder.map(card => card.id));
        flashcardsData.forEach(card => {
            if (!currentOrderIds.has(card.id)) {
                currentDisplayOrder.push(card);
            }
        });
        // 単語帳削除後、全カードの isAnswerDisplayed を false にする
        flashcardsData.forEach(card => card.isAnswerDisplayed = false);
        renderFlashcards(false);
        alert('単語帳を削除しました。');
    };

    const showVocabularySwitcherModal = () => {
        if (isSelectionMode) {
            alert('選択モードを終了してから単語帳を切り替えてください。');
            return;
        }
        renderVocabularyList();
        vocabularySwitcherModal.style.display = 'block';
        if (isDarkMode) {
            vocabularySwitcherModal.querySelector('.modal-content').classList.add('dark-mode');
        }
    };
    
    modeToggleButton.addEventListener('click', showVocabularySwitcherModal);
    addVocabularyBtn.addEventListener('click', addVocabulary);

    // 初期ロード時にカードの表示状態を問題に戻す
    flashcardsData.forEach(card => card.isAnswerDisplayed = false);
    applyDarkMode();
    updateHeaderTitle();
    updateDisplayToggleButtonText();
    updateLayoutToggleButtonIcon();
    renderFlashcards(false);
});
