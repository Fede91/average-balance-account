import React, { useEffect, useState, useCallback } from "react";
import {
  Navbar,
  Container,
  Form,
  Col,
  Row,
  Button,
  Modal,
  InputGroup,
  Tabs,
  Tab,
  Table,
  Alert
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import logo from "./assets/logo.svg";

import storageService from "./service/storage";
import revolutUtils from "./utils/revolut";
import currencyUtils from "./utils/currency";
import {
  concatTransactions,
  toBalance,
  getBalancesByDate,
  getCreditorNumbers,
  getAnnualBalance,
  getAverageBalance
} from "./utils/account";

import {
  CalendarLanguages as CalendarLanguagesEnum,
  Transaction as TypeTransaction,
  Balance as TypeBalance,
  CreditorNumber as TypeCreditorNumber
} from "./types";

const KEY_USER_AGREE_DISCLAIMER = "USER_AGREE_DISCLAIMER";

const App = () => {
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [showModalDisclaimer, setShowModalDisclaimer] = useState(false);
  const [showModalUpload, setShowModalUpload] = useState(false);
  const [showAlertWrongFile, setShowAlertWrongFile] = useState(false);
  const [rawData, setRawData] = useState<string | undefined>("");
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());
  const [transactions, setTransactions] = useState<TypeTransaction[]>([]);
  const [balancesByDate, setBalancesByDate] = useState<TypeBalance[]>([]);
  const [creditorNumbers, setCreditorNumber] = useState<TypeCreditorNumber[]>(
    []
  );
  const [annualBalance, setAnnualBalance] = useState<number | null>(null);
  const [averageBalance, setAverageBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!storageService.get(KEY_USER_AGREE_DISCLAIMER)) {
      setShowModalDisclaimer(true);
    }
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      const _initialBalance = toBalance(
        `${currentYear}-01-01`,
        initialBalance || 0
      );
      const balancesByDate = getBalancesByDate(_initialBalance, transactions);
      const creditorNumbers = getCreditorNumbers(balancesByDate);
      const annualBalance = getAnnualBalance(creditorNumbers);

      setBalancesByDate(balancesByDate);
      setCreditorNumber(creditorNumbers);
      setAnnualBalance(annualBalance);
      setAverageBalance(getAverageBalance(annualBalance, currentYear));
    }
  }, [
    transactions,
    setBalancesByDate,
    setCreditorNumber,
    setAnnualBalance,
    setAverageBalance,
    initialBalance,
    currentYear
  ]);

  const handleCloseModalUpload = () => setShowModalUpload(false);
  const handleShowModalUpload = () => setShowModalUpload(true);

  const handleUserAgree = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      storageService.set(KEY_USER_AGREE_DISCLAIMER, "true");
      setShowModalDisclaimer(false);
    },
    [setShowModalDisclaimer]
  );

  const handleLoadingFile = useCallback(() => {
    setShowAlertWrongFile(false);
    setIsParsingFile(true);
  }, [setShowAlertWrongFile, setIsParsingFile]);

  const handleFileRead = useCallback(
    (e: ProgressEvent<FileReader>) => {
      if (e.target) {
        setRawData(e.target.result?.toString());
        setIsParsingFile(false);
      }
    },
    [setIsParsingFile, setRawData]
  );

  const handleFileChosen = useCallback(
    (file: File | null) => {
      if (file) {
        let fileReader = new FileReader();
        fileReader.onloadstart = handleLoadingFile;
        fileReader.onloadend = handleFileRead;
        fileReader.readAsText(file);
      }
    },
    [handleFileRead, handleLoadingFile]
  );

  const handleUploadAccountBalance = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (rawData) {
        // TODO: check report type and merge data
        const newTransactions = revolutUtils.normalizeRawData(
          CalendarLanguagesEnum.IT,
          currentYear,
          rawData
        );

        if (!newTransactions) {
          setShowAlertWrongFile(true);
        } else {
          setTransactions(concatTransactions(transactions, newTransactions));
          setShowModalUpload(false);
        }
      } else {
        setShowModalUpload(false);
      }
    },
    [rawData, transactions, setShowModalUpload, currentYear, setTransactions]
  );

  return (
    <div>
      <Navbar bg={"primary"} variant={"dark"}>
        <Navbar.Brand>
          <img
            src={logo}
            width={"30"}
            height={"30"}
            className="d-inline-block align-top"
            alt={"Average Balance Account logo"}
          />
          <span className={"d-none d-md-inline-block"}>
            Average Balance Account
          </span>
        </Navbar.Brand>
        <Navbar.Collapse className={"justify-content-end"}>
          <Button variant={"primary"} onClick={handleShowModalUpload}>
            Carica
          </Button>
        </Navbar.Collapse>
      </Navbar>
      <Container>
        <Form>
          <Form.Group as={Row} controlId={"year"}>
            <Form.Label column sm={3}>
              Anno
            </Form.Label>
            <Col sm={3}>
              <Form.Control
                type={"text"}
                plaintext
                readOnly
                defaultValue={currentYear}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} controlId={"initialBalance"}>
            <Form.Label column sm={3}>
              Giacenza iniziale
            </Form.Label>
            <Col sm={4}>
              <InputGroup className={"mb-3"}>
                <InputGroup.Prepend>
                  <InputGroup.Text>€</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  aria-label={"Giacenza iniziale"}
                  type={"number"}
                  value={initialBalance.toString()}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setInitialBalance(parseFloat(e.target.value))
                  }
                />
              </InputGroup>
              <Form.Text className={"text-muted"}>
                {`Indica la giacenza al 01/01/${currentYear}`}
              </Form.Text>
            </Col>
          </Form.Group>

          {annualBalance && (
            <Form.Group as={Row} controlId={"annualBalance"}>
              <Form.Label column sm={4}>
                Giacenza annuale
              </Form.Label>
              <Col sm={3}>
                <Form.Control
                  key={annualBalance}
                  type={"text"}
                  plaintext
                  readOnly
                  defaultValue={currencyUtils.format(annualBalance)}
                />
              </Col>
            </Form.Group>
          )}

          {averageBalance && (
            <Form.Group as={Row} controlId={"averageBalance"}>
              <Form.Label column sm={4}>
                Giacenza media
              </Form.Label>
              <Col sm={8}>
                <Form.Control
                  key={averageBalance}
                  type={"text"}
                  plaintext
                  readOnly
                  defaultValue={currencyUtils.format(averageBalance)}
                />
              </Col>
            </Form.Group>
          )}
        </Form>

        <Row>
          <Col>
            {transactions.length > 0 && (
              <Tabs defaultActiveKey={"transactions"} id={"account-tabs-data"}>
                <Tab eventKey={"transactions"} title={"Movimenti"}>
                  <Table striped bordered hover size={"sm"} responsive>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Importo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(transaction => (
                        <tr key={transaction.key}>
                          <td>{transaction.date}</td>
                          <td>{currencyUtils.format(transaction.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Tab>
                <Tab eventKey={"balances"} title={"Saldi per valuta"}>
                  {balancesByDate.length > 0 && (
                    <Table striped bordered hover size={"sm"} responsive>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Importo</th>
                          <th>Totale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balancesByDate.map(balance => (
                          <tr key={balance.key}>
                            <td>{balance.date}</td>
                            <td>{currencyUtils.format(balance.amount)}</td>
                            <td>{currencyUtils.format(balance.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Tab>
                <Tab eventKey={"creditorNumbers"} title={"Numeri creditori"}>
                  {creditorNumbers.length > 0 && (
                    <Table striped bordered hover size={"sm"} responsive>
                      <thead>
                        <tr>
                          <td>Numero giorni</td>
                          <td>Importo</td>
                          <td>Numero creditore</td>
                        </tr>
                      </thead>
                      <tbody>
                        {creditorNumbers.map(creditorNumber => (
                          <tr key={creditorNumber.key}>
                            <td>{creditorNumber.numDays}</td>
                            <td>
                              {currencyUtils.format(creditorNumber.amount)}
                            </td>
                            <td>
                              {currencyUtils.format(creditorNumber.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Tab>
              </Tabs>
            )}
            {transactions.length === 0 && (
              <Alert variant={"primary"}>
                Carica l'estratto conto annuale o il primo estratto conto
                mensile per iniziare ad eseguire il calcolo della giacenza
                media.
              </Alert>
            )}
          </Col>
        </Row>
      </Container>

      {/* Modal Dislaimer */}
      <Modal show={showModalDisclaimer}>
        <Modal.Header>
          <Modal.Title>Avviso per l'utente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Average Balance Account (di seguito "prodotto") permette di eseguire
            il calcolo dei numeri creditori e della giacenza media partendo
            dagli estratti conto di un conto corrente / carta.
          </p>
          <p>
            L'applicazione è in via sperimentale pertanto è altamente
            consigliata la verifica dei risultati ottenuti.
            <br />
            Gli ideatori del PRODOTTO non sono responsabili nè direttamente nè
            indirettamente di errori dovuti al calcolo delle informazioni.
            <br />
            L'utente finale è l'unico responsabile sull'utilizzo delle
            informazioni calcolate dal PRODOTTO.
          </p>
          <p>
            NON BASARSI UNIVOCAMENTE SUI RISULTATI OTTENUTI DALL'APPLICAZIONE AI
            FINI DELLA DICHIARAZIONE ISEE.
          </p>
          <p>
            L'APPLICAZIONE NON MEMORIZZERÀ ALCUNA INFORMAZIONE AL DI FUORI DEL
            TUO DISPOSITIVO.
            <br />
            NESSUN DATO INSERITO DALL'UTENTE SARÀ CONDIVISO CON SOGGETTI DI
            TERZI PARTI.
          </p>
          <p>Average Balance Account è un progetto gratuito e open source.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant={"primary"} block onClick={handleUserAgree}>
            Confermo la presa visione
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Upload Form */}
      <Modal show={showModalUpload} onHide={handleCloseModalUpload}>
        <Form onSubmit={handleUploadAccountBalance}>
          <Modal.Header closeButton>
            <Modal.Title>Carica estratto conto</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Seleziona la tipologia di estratto conto da caricare</p>
            <Form.Check
              type={"radio"}
              id={`upload-type`}
              label={`Estratto conto Revolut`}
              defaultChecked
            />
            <p style={{ marginTop: "1em" }}>Seleziona il file in formato CSV</p>
            <Form.Group controlId={"formGroupFileUpload"}>
              <Form.Control
                type={"file"}
                accept={".csv"}
                required
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFileChosen(
                    e.target.files && e.target.files.length > 0
                      ? e.target.files[0]
                      : null
                  )
                }
              />
            </Form.Group>
            {showAlertWrongFile && (
              <Alert
                variant={"danger"}
                onClose={() => setShowAlertWrongFile(false)}
                dismissible
              >
                <Alert.Heading>Attenzione!</Alert.Heading>
                <p>
                  Il file selezionato non sembra essere rispettare la tipologia
                  di estratto conto selezionata.
                </p>
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant={"outline-secondary"}
              onClick={handleCloseModalUpload}
            >
              Annulla
            </Button>
            <Button
              variant={"primary"}
              type={"submit"}
              disabled={isParsingFile}
            >
              {isParsingFile ? "Analisi in corso…" : "Carica"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default App;
