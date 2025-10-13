import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name?: string;
  companyName: string;
}

export function WelcomeEmail({ name, companyName }: WelcomeEmailProps) {
  const previewText = `Welcome to Plato - Start managing your recipes today!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 Welcome to Plato!</Heading>
          
          <Text style={text}>
            Hi{name ? ` ${name}` : " there"},
          </Text>

          <Text style={text}>
            Welcome to Plato! We're excited to have {companyName} on board.
          </Text>

          <Text style={text}>
            Plato is your all-in-one solution for recipe costing and kitchen management. 
            Here's what you can do:
          </Text>

          <Section style={features}>
            <Text style={feature}>✅ Create and manage recipes</Text>
            <Text style={feature}>✅ Track ingredient costs</Text>
            <Text style={feature}>✅ Calculate food cost percentages</Text>
            <Text style={feature}>✅ Collaborate with your team</Text>
            <Text style={feature}>✅ Analyze profitability</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`}>
              Go to Dashboard
            </Button>
          </Section>

          <Text style={text}>
            If you have any questions, just reply to this email. We're here to help!
          </Text>

          <Text style={footer}>
            Best regards,<br />
            The Plato Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 40px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 40px",
};

const features = {
  margin: "16px 40px",
};

const feature = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "28px",
  margin: "8px 0",
};

const buttonContainer = {
  padding: "27px 40px",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "32px 40px",
};

