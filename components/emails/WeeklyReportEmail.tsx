import React from "react";

interface BillReport {
  parliamentId: string;
  title: string;
  status: string;
  votes: {
    for: number;
    against: number;
    neutral: number;
    total: number;
  };
  percentages: {
    for: number;
    against: number;
    neutral: number;
  };
}

interface WeeklyReportEmailProps {
  reportData: BillReport[];
  totalUsers: number;
  totalVotes: number;
  weekStart: string;
  weekEnd: string;
}

export default function WeeklyReportEmail({
  reportData,
  totalUsers,
  totalVotes,
  weekStart,
  weekEnd,
}: WeeklyReportEmailProps) {
  return (
    <html>
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Viikkoraportti - Eduskuntavahti</title>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "Arial, sans-serif", backgroundColor: "#f5f5f5" }}>
        {/* Main Container */}
          <table
            role="presentation"
            cellPadding={0}
            cellSpacing={0}
            border={0}
            width="100%"
            style={{ backgroundColor: "#f5f5f5", padding: "20px 0" }}
          >
          <tr>
            <td align="center">
              <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                width="600"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                {/* Header */}
                <tr>
                  <td
                    style={{
                      padding: "40px 40px 30px",
                      backgroundColor: "#2c3e50",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    <h1
                      style={{
                        margin: 0,
                        color: "#ffffff",
                        fontSize: "28px",
                        fontWeight: "bold",
                        fontFamily: "Arial, sans-serif",
                      }}
                    >
                      Eduskuntavahti
                    </h1>
                    <p
                      style={{
                        margin: "10px 0 0",
                        color: "#ecf0f1",
                        fontSize: "16px",
                        fontFamily: "Arial, sans-serif",
                      }}
                    >
                      Viikkoraportti: {weekStart} - {weekEnd}
                    </p>
                  </td>
                </tr>

                {/* Introduction */}
                <tr>
                  <td style={{ padding: "30px 40px" }}>
                    <p
                      style={{
                        margin: "0 0 20px",
                        color: "#2c3e50",
                        fontSize: "16px",
                        lineHeight: "1.6",
                        fontFamily: "Arial, sans-serif",
                      }}
                    >
                      Tämä raportti koostaa anonyymit äänestykset {totalUsers} käyttäjältä, jotka ovat
                      valinneet osallistua viikoittaiseen raportointiin.
                    </p>
                    <div
                      style={{
                        backgroundColor: "#e8f4f8",
                        padding: "20px",
                        borderRadius: "6px",
                        marginBottom: "30px",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          color: "#2c3e50",
                          fontSize: "14px",
                          lineHeight: "1.6",
                          fontFamily: "Arial, sans-serif",
                        }}
                      >
                        <strong>Yhteensä ääniä:</strong> {totalVotes}
                        <br />
                        <strong>Lakiesityksiä:</strong> {reportData.length}
                      </p>
                    </div>
                  </td>
                </tr>

                {/* Bills Section */}
                {reportData.length > 0 ? (
                  <>
                    <tr>
                      <td style={{ padding: "0 40px 20px" }}>
                        <h2
                          style={{
                            margin: 0,
                            color: "#2c3e50",
                            fontSize: "22px",
                            fontWeight: "bold",
                            fontFamily: "Arial, sans-serif",
                            borderBottom: "2px solid #3498db",
                            paddingBottom: "10px",
                          }}
                        >
                          Eduskunta vs. Kansa
                        </h2>
                      </td>
                    </tr>

                    {reportData.map((bill, index) => {
                      const gap = Math.abs(bill.percentages.for - 50); // Simplified gap calculation
                      const isHighGap = gap > 20;

                      return (
                        <tr key={index}>
                          <td style={{ padding: "0 40px 30px" }}>
                            <div
                              style={{
                                border: "1px solid #e0e0e0",
                                borderRadius: "6px",
                                padding: "20px",
                                backgroundColor: isHighGap ? "#fff5f5" : "#ffffff",
                              }}
                            >
                              {/* Bill Title */}
                              <h3
                                style={{
                                  margin: "0 0 10px",
                                  color: "#2c3e50",
                                  fontSize: "18px",
                                  fontWeight: "bold",
                                  fontFamily: "Arial, sans-serif",
                                }}
                              >
                                {bill.title}
                              </h3>
                              <p
                                style={{
                                  margin: "0 0 15px",
                                  color: "#7f8c8d",
                                  fontSize: "14px",
                                  fontFamily: "Arial, sans-serif",
                                }}
                              >
                                {bill.parliamentId} • Status: {bill.status}
                              </p>

                              {/* Vote Bars */}
                              <div style={{ marginBottom: "15px" }}>
                                {/* For Votes */}
                                <div style={{ marginBottom: "10px" }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      marginBottom: "5px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: "#2c3e50",
                                        fontSize: "14px",
                                        fontFamily: "Arial, sans-serif",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Puolesta
                                    </span>
                                    <span
                                      style={{
                                        color: "#2c3e50",
                                        fontSize: "14px",
                                        fontFamily: "Arial, sans-serif",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {bill.percentages.for}% ({bill.votes.for} ääntä)
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      width: "100%",
                                      height: "24px",
                                      backgroundColor: "#ecf0f1",
                                      borderRadius: "4px",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${bill.percentages.for}%`,
                                        height: "100%",
                                        backgroundColor: "#27ae60",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "flex-end",
                                        paddingRight: "8px",
                                      }}
                                    >
                                      {bill.percentages.for > 10 && (
                                        <span
                                          style={{
                                            color: "#ffffff",
                                            fontSize: "12px",
                                            fontFamily: "Arial, sans-serif",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          {bill.percentages.for}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Against Votes */}
                                <div style={{ marginBottom: "10px" }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      marginBottom: "5px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: "#2c3e50",
                                        fontSize: "14px",
                                        fontFamily: "Arial, sans-serif",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Vastaan
                                    </span>
                                    <span
                                      style={{
                                        color: "#2c3e50",
                                        fontSize: "14px",
                                        fontFamily: "Arial, sans-serif",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {bill.percentages.against}% ({bill.votes.against} ääntä)
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      width: "100%",
                                      height: "24px",
                                      backgroundColor: "#ecf0f1",
                                      borderRadius: "4px",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${bill.percentages.against}%`,
                                        height: "100%",
                                        backgroundColor: "#e74c3c",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "flex-end",
                                        paddingRight: "8px",
                                      }}
                                    >
                                      {bill.percentages.against > 10 && (
                                        <span
                                          style={{
                                            color: "#ffffff",
                                            fontSize: "12px",
                                            fontFamily: "Arial, sans-serif",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          {bill.percentages.against}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Neutral Votes */}
                                {bill.votes.neutral > 0 && (
                                  <div>
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "5px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          color: "#2c3e50",
                                          fontSize: "14px",
                                          fontFamily: "Arial, sans-serif",
                                        }}
                                      >
                                        Neutraali
                                      </span>
                                      <span
                                        style={{
                                          color: "#7f8c8d",
                                          fontSize: "14px",
                                          fontFamily: "Arial, sans-serif",
                                        }}
                                      >
                                        {bill.percentages.neutral}% ({bill.votes.neutral} ääntä)
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* High Gap Warning */}
                              {isHighGap && (
                                <div
                                  style={{
                                    backgroundColor: "#fee",
                                    border: "1px solid #e74c3c",
                                    borderRadius: "4px",
                                    padding: "10px",
                                    marginTop: "15px",
                                  }}
                                >
                                  <p
                                    style={{
                                      margin: 0,
                                      color: "#c0392b",
                                      fontSize: "13px",
                                      fontFamily: "Arial, sans-serif",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    ⚠️ Merkittävä ero kansalaisten ja eduskunnan näkemyksissä
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                ) : (
                  <tr>
                    <td style={{ padding: "30px 40px" }}>
                      <p
                        style={{
                          margin: 0,
                          color: "#7f8c8d",
                          fontSize: "16px",
                          fontFamily: "Arial, sans-serif",
                          textAlign: "center",
                        }}
                      >
                        Ei ääniä tällä viikolla.
                      </p>
                    </td>
                  </tr>
                )}

                {/* Footer */}
                <tr>
                  <td
                    style={{
                      padding: "30px 40px",
                      backgroundColor: "#ecf0f1",
                      borderRadius: "0 0 8px 8px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 10px",
                        color: "#7f8c8d",
                        fontSize: "14px",
                        fontFamily: "Arial, sans-serif",
                      }}
                    >
                      Tämä on automaattinen viikkoraportti Eduskuntavahti-palvelusta.
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: "#95a5a6",
                        fontSize: "12px",
                        fontFamily: "Arial, sans-serif",
                      }}
                    >
                      Äänet ovat anonyymejä ja koostettu vain niiltä käyttäjiltä, jotka ovat
                      valinneet osallistua raportointiin.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

