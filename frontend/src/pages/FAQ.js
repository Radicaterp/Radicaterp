import { useState } from "react";
import Navbar from "../components/Navbar";
import { ChevronDown } from "lucide-react";

const FAQ = () => {
  const [openItem, setOpenItem] = useState(null);

  const faqCategories = [
    {
      category: "🎮 Generelt om Serveren",
      items: [
        {
          question: "Hvordan joiner jeg Redicate serveren?",
          answer: "For at joine serveren skal du først have FiveM installeret. Søg derefter efter 'Redicate' i FiveM server browseren, eller brug vores direkte connect IP. Sørg for at du har læst vores regler før du starter!"
        },
        {
          question: "Hvad er server reglerne?",
          answer: "Vores vigtigste regler inkluderer:\n\n• Ingen RDM (Random Deathmatch)\n• Ingen VDM (Vehicle Deathmatch)\n• Respekter RP situationer\n• Ingen metagaming\n• Følg staff instruktioner\n• Brug passende sprog i alle kanaler\n\nSe vores fulde regelsæt i Discord!"
        },
        {
          question: "Hvad er whitelisted jobs?",
          answer: "Whitelisted jobs er roller der kræver godkendelse før du kan spille dem. Dette inkluderer typisk politi, EMS, og andre vigtige roller. Du skal ansøge via vores hjemmeside og blive godkendt af staff."
        },
        {
          question: "Hvor mange karakterer kan jeg have?",
          answer: "Du kan oprette op til 3 forskellige karakterer på serveren. Husk at hver karakter skal have sin egen unikke historie og personlighed - blanding af karakterer er ikke tilladt!"
        }
      ]
    },
    {
      category: "📝 Ansøgninger",
      items: [
        {
          question: "Hvordan ansøger jeg om whitelist job?",
          answer: "Log ind på hjemmesiden med din Discord, gå til 'Ansøgninger' siden, og vælg det job du vil ansøge om. Udfyld alle spørgsmål grundigt og ærligt. Staff gennemgår ansøgninger løbende."
        },
        {
          question: "Hvor lang tid tager det at få svar på min ansøgning?",
          answer: "Behandlingstiden varierer afhængigt af antallet af ansøgninger, men typisk får du svar inden for 3-7 dage. Du kan se status på dine ansøgninger under 'Mine Rapporter' siden."
        },
        {
          question: "Hvad sker der hvis min ansøgning bliver afvist?",
          answer: "Hvis din ansøgning afvises, får du besked om hvorfor. Du kan normalt ansøge igen efter 2 uger. Brug tiden på at forbedre de områder staff har påpeget."
        },
        {
          question: "Kan jeg ansøge om flere jobs samtidig?",
          answer: "Ja, du kan have flere aktive ansøgninger, men vi anbefaler at fokusere på én ad gangen for at vise engagement. Nogle jobs kan ikke kombineres (f.eks. politi og kriminel)."
        }
      ]
    },
    {
      category: "🚨 Rapporter & Regler",
      items: [
        {
          question: "Hvordan rapporterer jeg en regelbryder?",
          answer: "Gå til 'Rapporter' siden på hjemmesiden, eller brug /report kommandoen in-game. Beskriv situationen detaljeret og inkluder bevis hvis muligt (clips, screenshots). Staff vil undersøge sagen."
        },
        {
          question: "Hvad tæller som gyldigt bevis?",
          answer: "Gyldigt bevis inkluderer:\n\n• Video clips (foretrukket)\n• Screenshots med context\n• Logs fra serveren\n• Vidne udsagn fra flere personer\n\nHusk at inkludere tid og sted for hændelsen!"
        },
        {
          question: "Kan jeg se status på min rapport?",
          answer: "Ja! Log ind på hjemmesiden og gå til 'Mine Rapporter'. Her kan du se status på alle dine indsendte rapporter og eventuelle kommentarer fra staff."
        },
        {
          question: "Hvad betyder de forskellige rapport statuser?",
          answer: "⏳ Afventer: Rapporten er modtaget og venter på staff review\n🔍 Undersøges: Staff er aktivt ved at undersøge sagen\n✅ Afsluttet: Sagen er løst og action er taget\n❌ Afvist: Rapporten var ugyldig eller uden tilstrækkeligt bevis"
        }
      ]
    },
    {
      category: "👮 Staff & Support",
      items: [
        {
          question: "Hvordan kontakter jeg staff?",
          answer: "Du kan kontakte staff på flere måder:\n\n• Brug /admin kommandoen in-game\n• Skriv i #support kanalen i Discord\n• Send en DM til en staff medlem\n• Opret en support ticket i Discord\n\nI akutte situationer, brug altid /admin!"
        },
        {
          question: "Kan jeg ansøge om at blive staff?",
          answer: "Ja! Vi søger regelmæssigt efter nye staff medlemmer. Du skal minimum være 16 år, have været aktiv på serveren i mindst 2 måneder, og have et rent rulleblad. Hold øje med ansøgninger på hjemmesiden."
        },
        {
          question: "Hvad er forskellen på de forskellige staff roller?",
          answer: "• Staff Member: Håndterer basis support og rapporter\n• Admin: Fuld support adgang og kan håndtere komplekse sager\n• Head Admin: Leder et staff team\n• Super Admin: Fuld adgang til alle systemer og træffer vigtige beslutninger"
        },
        {
          question: "Hvad sker der hvis jeg får en advarsel?",
          answer: "Advarsler bliver noteret i dit system. Gentagne overtrædelser kan føre til:\n\n• 1. advarsel: Verbal advarsel\n• 2. advarsel: Midlertidig ban (1-3 dage)\n• 3. advarsel: Længere ban (7-30 dage)\n• Ved alvorlige overtrædelser: Permanent ban"
        }
      ]
    },
    {
      category: "💡 Teknisk Support",
      items: [
        {
          question: "Jeg kan ikke connecte til serveren, hvad gør jeg?",
          answer: "Prøv følgende:\n\n1. Genstart FiveM\n2. Tjek din internet forbindelse\n3. Ryd FiveM cache\n4. Opdater FiveM til seneste version\n5. Tjek om serveren er online i vores Discord\n\nHvis problemet fortsætter, kontakt tech support i Discord."
        },
        {
          question: "Jeg oplever lag eller FPS drops, hvordan fikser jeg det?",
          answer: "Optimeringstips:\n\n• Sænk grafik indstillinger i FiveM\n• Luk unødvendige baggrundsprogrammer\n• Opdater dine grafikkort drivers\n• Tjek om andre spiller oplever det samme\n• Sørg for stabil internet forbindelse\n\nHvis kun du oplever det, er det sandsynligvis din PC."
        },
        {
          question: "Mine scripts/mods virker ikke, hvad skal jeg gøre?",
          answer: "Redicate tillader IKKE custom scripts eller mods uden godkendelse. Brug kun approved scripts fra vores Discord. Uautoriserede mods kan føre til ban!"
        },
        {
          question: "Hvordan opdaterer jeg mine FiveM assets?",
          answer: "FiveM opdaterer normalt automatisk. Hvis der er problemer:\n\n1. Luk FiveM helt\n2. Slet cache mappen (FiveM/cache)\n3. Start FiveM igen\n4. Lad den downloade nye assets\n\nUndlad at slette hele FiveM installationen medmindre det er absolut nødvendigt!"
        }
      ]
    },
    {
      category: "🎭 Roleplay & Economy",
      items: [
        {
          question: "Hvad er New Life Rule (NLR)?",
          answer: "NLR betyder at når din karakter dør, må du ikke:\n\n• Huske hvad der skete før døden\n• Vende tilbage til dødsstedet i 15 minutter\n• Hævne dig på folk der dræbte dig\n• Fortsætte den samme RP situation\n\nDin karakter starter 'et nyt liv' efter respawn."
        },
        {
          question: "Hvordan tjener jeg penge på serveren?",
          answer: "Der er mange måder at tjene penge:\n\n• Lovlige jobs: Politi, EMS, Mekaniker, Lastbilchauffør\n• Civile jobs: Miner, Skovhugger, Fisker\n• Business: Start din egen virksomhed\n• Kriminelt: Drug dealing, røverier (på egen risiko!)\n\nStart med lovlige jobs for at opbygge kapital!"
        },
        {
          question: "Kan jeg købe/sælge ting til andre spillere?",
          answer: "Ja! Du kan handle med andre spillere, men det skal ske in-character (IC). Brug ikke /me kommandoer til at overføre items. Real money trading (RMT) er STRENGT forbudt og fører til permanent ban!"
        },
        {
          question: "Hvad er forskellen på IC og OOC?",
          answer: "IC (In-Character): Alt du gør og siger som din karakter\nOOC (Out-Of-Character): Kommunikation uden for din karakter\n\nHold altid IC og OOC adskilt! Brug /ooc chat for OOC beskeder, og lad aldrig OOC drama påvirke IC handlinger."
        }
      ]
    }
  ];

  const toggleItem = (categoryIndex, itemIndex) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItem(openItem === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] bg-grid">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-6 py-8 mt-24">
        {/* Header */}
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 gradient-text">
            Ofte Stillede Spørgsmål
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Find svar på de mest almindelige spørgsmål om Redicate serveren
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="animate-fade-in" style={{ animationDelay: `${categoryIndex * 0.1}s` }}>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                {category.category}
              </h2>
              
              <div className="space-y-3">
                {category.items.map((item, itemIndex) => {
                  const key = `${categoryIndex}-${itemIndex}`;
                  const isOpen = openItem === key;
                  
                  return (
                    <div
                      key={itemIndex}
                      className="glass-card rounded-xl overflow-hidden border border-[#4A90E2]/20 transition-all duration-300 hover:border-[#4A90E2]/40"
                    >
                      <button
                        onClick={() => toggleItem(categoryIndex, itemIndex)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#4A90E2]/5 transition-colors"
                      >
                        <span className="text-white font-semibold pr-4">
                          {item.question}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-[#4A90E2] flex-shrink-0 transition-transform duration-300 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="px-6 pb-4 pt-2 text-gray-300 whitespace-pre-line border-t border-[#4A90E2]/10">
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 glass-card p-8 rounded-2xl text-center animate-fade-in">
          <h3 className="text-2xl font-bold text-white mb-4">
            Kunne ikke finde hvad du ledte efter?
          </h3>
          <p className="text-gray-400 mb-6">
            Kontakt vores staff team i Discord eller brug /admin kommandoen in-game
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://discord.gg/redicate"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-lg transition-colors"
            >
              📱 Join Discord
            </a>
            <button
              onClick={() => window.location.href = "/report"}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:opacity-90 text-white font-semibold rounded-lg transition-opacity"
            >
              🚨 Rapporter Problem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
