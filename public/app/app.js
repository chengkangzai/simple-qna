particleJS()
makeFloatOnParticle("content-wrapper");

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

let userName;

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        userName = user.displayName;
        $('.user-name').text(user.displayName);
    } else {
        window.location.href = "../index.html";
    }
});


db
    .collection("ans")
    .where('deleted', '!=', true)
    .onSnapshot(snap => {
        if (snap.empty) {
            $("#resultBody").append(`
<tr id="no-record">
    <td colspan="5" class="text-center">No record yet</td>
</tr>`);
            return;
        }
        const resultTable = $("#resultTable");
        resultTable.DataTable().clear().destroy();
        snap.forEach(doc => {
            let data = doc.data();
            const lastUpdate = (() => {
                if (!data.update_at) {
                    return "N/A";
                } else {
                    let [hour, minute, second] = data.update_at.toDate().toLocaleTimeString("en-US").split(/:| /)
                    return `${hour}:${minute}:${second}`
                }
            })()
            $("#resultBody").append(`
    <tr id=${doc.id}> 
        <td>${data.question}</td>
        <td>${data.answer}</td>
        <td>${data.submitBy}</td>
        <td>${lastUpdate || "N/A"}</td>
        <td>
        <button class="btn btn-sm btn-primary mt-1" onclick="edit('${doc.id}')"> Edit </button> 
        <button class="btn btn-sm btn-danger mt-1" onclick="deleteEntry('${doc.id}')"> Delete </button>
        </td>
    </tr>`);
        });
        resultTable.DataTable({
            lengthMenu: [
                [-1, 10, 25, 50],
                ['Show all', '10 rows', '25 rows', '50 rows']
            ],
            //State the index 4 is date
            columnDefs: [{
                type: 'date',
                targets: [3],
            }],
            order: [
                [1, "desc"]
            ],
            bAutoWidth: false,
            aoColumns: [
                {sWidth: '40%'},
                {sWidth: '30%'},
                {sWidth: '10%'},
                {sWidth: '10%'},
                {sWidth: '10%'},
            ]
        })
    })

function edit(docId) {
    db
        .doc(`ans/${docId}`)
        .get()
        .then(doc => {
            let data = doc.data();
            const imageDom = (() => {
                return (data.image?.question === undefined) ? "" :
                    `<hr><h6>Question</h6><img src="${data.image?.question}"  alt="Image of the question"/><hr>
                    <h6>Answer</h6><img src="${data.image?.answer}"  alt="Image for the answer"/><br>`;
            })();
            let dom = `
<label for="questionInput_${docId}" >Question</label>
<input type="text" name="questionInput" id="questionInput_${docId}" class="form-control" placeholder="Question" value="${data.question}">
<label for="answerInput_${docId}" >Answer</label>
<input type="text" name="answerInput" id="answerInput_${docId}" class="form-control" placeholder="Answer" value="${data.answer}">
${imageDom}
<button class="btn mt-2 btn-success" onclick="store('${docId}')"> Submit </button>
<small>Click "Submit" to update, Close wont save it ya</small>`;
            let modal = new Modal(`Edit : ${data.question}`, dom);
            modal.id = docId
            modal.show()
        })
        .catch(error => {
            new Modal("Warning", error).show();
        })
}

function store(docId) {
    const q = $(`#questionInput_${docId}`).val();
    const a = $(`#answerInput_${docId}`).val();
    let valid = true;
    if (isEmpty(q) || isEmpty(a)) {
        new Modal("Warning", "Empty question or answer").show();
        valid = false;
    }
    if (valid) {
        db
            .doc(`ans/${docId}`)
            .update({
                question: escapeHtml(q),
                answer: escapeHtml(a),
                update_at: firebase.firestore.Timestamp.fromDate(new Date()),
                update_by: userName,
                deleted: false,
            })
            .then(() => {
                $(`#modal-${docId}`).modal('hide')
            })
            .catch(error => {
                new Modal("Warning", error).show();
            })
    }
}

function deleteEntry(docId) {
    db
        .collection("ans")
        .doc(docId)
        .update({deleted: true, deletedBy: userName})
        .then(() => {
            $("#" + docId).remove();
            const randomId = Math.round(Math.random() * 11000011111);
            $("#alert-holder").append(`
               <div class="alert alert-success" role="alert" id="alert-${randomId}">
                   <p>Delete Success <a href="#" onclick="rescue('${docId}','alert-${randomId}')">Whoops! Undo</a></p>
                   <div class="spinner-border text-dark float-right" style="margin-top: -35px" role="status" aria-hidden="true" ></div>
               </div>
                `)

            setTimeout(() => {
                $(`#alert-${randomId}`).remove();
            }, 5000)
        }).catch((error) => {
        new Modal("Warning", error).show();
    });
}

// Helper
function isEmpty(input) {
    return (input.length === 0 || !input.trim());
}

function checkIfIsEnter(event) {
    if (event.keyCode === 13) submit()
}

function submit() {
    const q = $("#questionInput").val()
    const a = $("#answerInput").val()
    let valid = true;
    if (isEmpty(q) || isEmpty(a)) {
        new Modal("Warning", "Empty question or answer").show();
        valid = false;
    }

    const info = (() => {
        const q = $("#questionInput-img").val();
        const a = $("#answerInput-img").val();
        return !(q === "" && a === "") ? {question: q, answer: a} : {};
    })();

    if (valid) {
        db
            .collection("ans")
            .add({
                question: escapeHtml(q),
                answer: escapeHtml(a),
                submitBy: userName,
                timestamp: firebase.firestore.Timestamp.fromDate(new Date()),
                image: info,
                deleted: false,
            })
            .then(() => {
                $("#questionInput").val("");
                $("#questionInput-img").val("");
                $("#answerInput").val("");
                $("#answerInput-img").val("");
                $("#question-info").text("")
                $("#answer-info").text("")
            })
            .catch(err => {
                new Modal("Error", err).show()
            });
    }
}

window.addEventListener('paste', e => {
    if (e.clipboardData.files.length === 1) {
        const mode = (() => {
            return ($("#questionInput").is(":focus")) ? "question" : (($("#answerInput").is(":focus")) ? "answer" : "Modal");
        })();

        if (!(mode === "Modal")) {
            $("#" + mode + "-info").text("✔");
        }

        //got Image !
        const file = e.clipboardData.files[0];
        const extension = (file.name).split(".")[1];
        const fileName = Math.floor(Math.random() * 1000000000);
        const storageRef = firebase.storage().ref(`pic/${fileName}.${extension}`);
        const task = storageRef.put(file);

        task.on('state_changed',
            function progress(snapshot) {
                let percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log("Upload Progress is " + percentage);
            },
            function error(error) {
                new Modal("Warning", error).show()
            },
            function complete() {
                if (!(mode === "Modal")) {
                    $("#" + mode + "-info").text("✔✔");
                }
                task.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    console.log(downloadURL)
                    if (!(mode === "Modal")) {
                        $("#" + mode + "Input-img").val(downloadURL);
                    }
                });

                $.ajax({
                    type: "POST",
                    url: "https://us-central1-simple-qna.cloudfunctions.net/getText",
                    header: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    data: {
                        address: fileName + "." + extension
                    },
                    success: (res) => {
                        let text = (res.data.text).replace("\n", " ");
                        if (mode === "Modal") {
                            new Modal("OCR !!!!", `Sorry i did not know whether this is question or answer... so i put it here <br>
                            <textarea cols="100" rows="10" class="form-control">${text}</textarea>`).show()
                        } else {
                            $("#" + mode + "Input").val(text);
                            $("#" + mode + "-info").text("✔✔✔");
                        }
                    }
                });
            });
    }
})

function howToUse() {
    new Modal("Information", `
    <h5> Instruction --> Add question and answer</h5>
    <ol> 
        <li> Use key stroke "Win + Shift + S" to take a screenshot </li>
        <li> Use key stroke "Ctrl + V" to paste it to the specific section(Question/Answer) </li>
    </ol>

    <h5> Instruction --> Get question and its answer</h5>
    <ol> 
        <li> Search the question (few word) in the search field on the table </li>
    </ol>

    <h5> Meaning of ✔ </h5>
    <ul>
        <li> ✔ --> Image detected </li>
        <li> ✔✔ --> Finish uploading image </li>
        <li> ✔✔✔ --> Finish convert to text </li>
    </ul>
    `).show();
}

function recycle() {
    db
        .collection('ans')
        .where('deleted', '==', true)
        .get()
        .then(snap => {
            const randomId = Math.round(Math.random() * 11000011111);
            if (!(snap.empty)) {

                const tempDom = []
                snap.forEach((doc => {
                    const data = doc.data()
                    tempDom.push(
                        `
                        <tr>
                        <td>${data.question} </td>
                        <td>${data.answer}</td>
                        <td>${data.submitBy}</td>
                        <td> <button class="btn btn-outline-primary btn-sm" onclick="rescue('${doc.id}','modal-${randomId}')">Rescue</button> </td>
                        </tr>
                    `)
                }))
                let modal = new Modal('Deleted Item', `
                <table id="recycleHead${randomId}" class="table table-bordered table-light table-striped">
                <thead> <tr> <th>Question</th> <th>Answer</th> <th>Submit By</th> <th>Action</th> </tr></thead>
                 <tbody id="recycleBody${randomId}">${tempDom.join(' ')}</tbody> </table>`);
                modal.id = randomId
                modal.show();
                $(`#recycleHead${randomId}`).DataTable();
            } else {
                new Modal('Deleted Item', 'No Deleted Item').show()
            }
        })
}

function rescue(docID, displayId) {
    db
        .collection("ans")
        .doc(docID)
        .update({deleted: false, rescueBy: userName,})
        .then(() => {
            const mode = displayId.split("-")[0]
            if (mode === "modal") {
                $(`#${displayId}`).modal('hide');
            }
            if (mode === "alert") {
                $(`#${displayId}`).remove();
            }
        })
        .catch((error) => {
            new Modal("Warning", error).show();
        });
}
